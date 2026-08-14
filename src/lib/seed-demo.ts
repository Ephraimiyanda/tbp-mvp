import { assistOnExercise } from "./care-loop";
import {
  DEMO_COMMUNITIES,
  DEMO_FALLBACK_PLAN,
  DEMO_PASSWORD,
  DEMO_PLAN_AMOUNT_KOBO,
  DEMO_PROFESSIONALS,
  DEMO_STUDENTS,
  type DemoLoopExercise,
  type DemoStudent,
} from "./demo-data";
import { createAdminClient } from "./supabase/admin";
import { planForConcerns } from "./types";

type Admin = ReturnType<typeof createAdminClient>;

const PAST_NOTE = "Care Loop demo · past session";
const UPCOMING_NOTE = "Care Loop demo · upcoming session";

async function findUserIdByEmail(admin: Admin, email: string) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

async function ensureDemoUser(
  admin: Admin,
  input: {
    email: string;
    full_name: string;
    role: "professional" | "student";
    university?: string;
    year_of_study?: string;
    gender?: string;
  },
) {
  let userId = await findUserIdByEmail(admin, input.email);
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: input.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: input.full_name, role: input.role },
    });
    if (error) throw error;
    userId = data.user?.id ?? null;
  }
  if (!userId) throw new Error(`Could not create ${input.email}`);

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: input.email,
      full_name: input.full_name,
      role: input.role,
      university: input.university ?? null,
      year_of_study: input.year_of_study ?? null,
      gender: input.gender ?? null,
      consented_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;
  return userId;
}

async function ensureSession(
  admin: Admin,
  input: {
    subscriptionId: string;
    studentId: string;
    professionalId: string;
    scheduledAt: string;
    durationMin: number;
    modality: "chat" | "video";
    status: "scheduled" | "released" | "completed";
    notes: string;
    meetUrl?: string | null;
  },
) {
  const { data: existing } = await admin
    .from("sessions")
    .select("id")
    .eq("subscription_id", input.subscriptionId)
    .eq("notes_professional", input.notes)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data: session, error } = await admin
    .from("sessions")
    .insert({
      subscription_id: input.subscriptionId,
      student_id: input.studentId,
      professional_id: input.professionalId,
      scheduled_at: input.scheduledAt,
      duration_min: input.durationMin,
      modality: input.modality,
      status: input.status,
      notes_professional: input.notes,
      meet_released_at:
        input.modality === "video" && input.status !== "scheduled" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error || !session) throw error ?? new Error("Could not create demo session");

  if (input.modality === "video" && input.meetUrl) {
    await admin.from("session_meet_links").upsert(
      { session_id: session.id, meet_url: input.meetUrl },
      { onConflict: "session_id" },
    );
  }
  return session.id as string;
}

async function ensureLoopPlan(
  admin: Admin,
  input: {
    sessionId: string;
    subscriptionId: string;
    studentId: string;
    professionalId: string;
    title: string;
    exercises: DemoLoopExercise[];
    archive?: boolean;
  },
) {
  const { data: existing } = await admin
    .from("loop_plans")
    .select("id")
    .eq("session_id", input.sessionId)
    .maybeSingle();

  let planId = existing?.id as string | undefined;
  if (!planId) {
    const { data: created, error } = await admin
      .from("loop_plans")
      .insert({
        session_id: input.sessionId,
        subscription_id: input.subscriptionId,
        student_id: input.studentId,
        professional_id: input.professionalId,
        title: input.title,
        status: input.archive ? "archived" : "published",
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !created) throw error ?? new Error("Could not create loop plan");
    planId = created.id as string;
  } else {
    await admin
      .from("loop_plans")
      .update({
        title: input.title,
        status: input.archive ? "archived" : "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", planId);
  }

  const { data: existingExercises } = await admin
    .from("loop_exercises")
    .select("id")
    .eq("plan_id", planId);
  if (!existingExercises?.length) {
    const rows = input.exercises.map((ex, i) => ({
      plan_id: planId,
      sort_order: i,
      title: ex.title,
      instructions: ex.instructions,
      resource_url: ex.resource_url ?? null,
    }));
    const { error } = await admin.from("loop_exercises").insert(rows);
    if (error) throw error;
  }

  const { data: exercises } = await admin
    .from("loop_exercises")
    .select("id, title, instructions, sort_order")
    .eq("plan_id", planId)
    .order("sort_order", { ascending: true });

  for (const [i, spec] of input.exercises.entries()) {
    const row = exercises?.[i];
    if (!row) continue;
    if (spec.completed) {
      await admin.from("loop_exercise_progress").upsert(
        {
          exercise_id: row.id,
          student_id: input.studentId,
          completed_at: new Date(Date.now() - (input.exercises.length - i) * 3600_000).toISOString(),
        },
        { onConflict: "exercise_id,student_id" },
      );
    }
    if (spec.stuck_question) {
      const { data: prior } = await admin
        .from("loop_assists")
        .select("id")
        .eq("exercise_id", row.id)
        .eq("student_id", input.studentId)
        .limit(1);
      if (!prior?.length) {
        await admin.from("loop_assists").insert({
          exercise_id: row.id,
          student_id: input.studentId,
          question: spec.stuck_question,
          suggestion: assistOnExercise(
            { title: row.title as string, instructions: row.instructions as string },
            spec.stuck_question,
          ),
        });
      }
    }
  }

  return planId;
}

async function seedStudentPair(
  admin: Admin,
  student: DemoStudent,
  proId: string,
  meetUrl: string | null,
  groupId: string | undefined,
) {
  const studentId = await ensureDemoUser(admin, {
    email: student.email,
    full_name: student.full_name,
    role: "student",
    university: student.university,
    year_of_study: student.year_of_study,
    gender: student.pref_gender,
  });

  const { data: intake } = await admin
    .from("intakes")
    .select("id")
    .eq("student_id", studentId)
    .limit(1)
    .maybeSingle();
  if (!intake) {
    const { error } = await admin.from("intakes").insert({
      student_id: studentId,
      concerns: student.concerns,
      prior_counseling: "No",
      counselor_style: student.counselor_style,
      tone: student.tone,
      communication: student.communication,
      pref_gender: student.pref_gender,
      lgbtq_affirming: student.lgbtq_affirming,
      faith_sensitive: student.faith_sensitive,
      answers: { demo: true, concerns: student.concerns },
    });
    if (error) throw error;
  }

  const { data: match, error: matchError } = await admin
    .from("matches")
    .upsert(
      {
        student_id: studentId,
        professional_id: proId,
        status: "subscribed",
        reasons: ["Demo Care Loop pair"],
      },
      { onConflict: "student_id,professional_id" },
    )
    .select("id")
    .single();
  if (matchError || !match) throw matchError ?? new Error("Could not match demo student");

  const programme = planForConcerns(student.concerns);
  const { data: sub, error: subError } = await admin
    .from("subscriptions")
    .upsert(
      {
        student_id: studentId,
        professional_id: proId,
        match_id: match.id,
        status: "active",
        plan: "student",
        session_type: student.session_type,
        meet_url: student.session_type === "video" ? meetUrl : null,
      },
      { onConflict: "student_id,professional_id" },
    )
    .select("id")
    .single();
  if (subError || !sub) throw subError ?? new Error("Could not subscribe demo student");

  await admin.from("care_plans").upsert(
    {
      subscription_id: sub.id,
      primary_issue: programme.issue,
      duration_weeks: programme.weeks,
      session_target: programme.sessions,
    },
    { onConflict: "subscription_id" },
  );

  await admin.from("payments").upsert(
    {
      subscription_id: sub.id,
      student_id: studentId,
      amount_kobo: DEMO_PLAN_AMOUNT_KOBO,
      currency: "NGN",
      provider: "paystack_mock",
      reference: `demo-loop-${student.email}`,
      status: "success",
    },
    { onConflict: "reference" },
  );

  const pastId = await ensureSession(admin, {
    subscriptionId: sub.id,
    studentId,
    professionalId: proId,
    scheduledAt: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(),
    durationMin: student.session_type === "chat" ? 40 : 50,
    modality: student.session_type,
    status: "completed",
    notes: PAST_NOTE,
    meetUrl,
  });
  await ensureLoopPlan(admin, {
    sessionId: pastId,
    subscriptionId: sub.id,
    studentId,
    professionalId: proId,
    title: student.plan_title,
    exercises: student.exercises,
  });

  await ensureSession(admin, {
    subscriptionId: sub.id,
    studentId,
    professionalId: proId,
    scheduledAt: new Date(Date.now() - 8 * 60_000).toISOString(),
    durationMin: student.session_type === "chat" ? 40 : 50,
    modality: student.session_type,
    status: "scheduled",
    notes: UPCOMING_NOTE,
    meetUrl,
  });

  if (groupId) {
    await admin.from("group_members").upsert(
      {
        group_id: groupId,
        profile_id: studentId,
        role: "member",
        display_name: student.full_name.split(" ")[0],
      },
      { onConflict: "group_id,profile_id" },
    );
  }

  return { email: student.email, name: student.full_name, id: studentId, plan: student.plan_title };
}

async function seedPlansForExistingSubs(admin: Admin, seededStudentIds: Set<string>) {
  const { data: subs, error } = await admin
    .from("subscriptions")
    .select("id, student_id, professional_id, session_type")
    .eq("status", "active");
  if (error) throw error;

  const filled: { student: string; plan: string }[] = [];
  for (const sub of subs ?? []) {
    if (seededStudentIds.has(sub.student_id as string)) continue;

    const { data: published } = await admin
      .from("loop_plans")
      .select("id")
      .eq("subscription_id", sub.id)
      .eq("status", "published")
      .limit(1)
      .maybeSingle();
    if (published) continue;

    const { data: session } = await admin
      .from("sessions")
      .select("id, notes_professional")
      .eq("subscription_id", sub.id)
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    let sessionId = session?.id as string | undefined;
    if (!sessionId) {
      sessionId = await ensureSession(admin, {
        subscriptionId: sub.id as string,
        studentId: sub.student_id as string,
        professionalId: sub.professional_id as string,
        scheduledAt: new Date(Date.now() - 2 * 24 * 3600_000).toISOString(),
        durationMin: 40,
        modality: sub.session_type === "video" ? "video" : "chat",
        status: "completed",
        notes: PAST_NOTE,
      });
    }

    await ensureLoopPlan(admin, {
      sessionId,
      subscriptionId: sub.id as string,
      studentId: sub.student_id as string,
      professionalId: sub.professional_id as string,
      title: DEMO_FALLBACK_PLAN.title,
      exercises: DEMO_FALLBACK_PLAN.exercises,
    });

    const { data: upcoming } = await admin
      .from("sessions")
      .select("id")
      .eq("subscription_id", sub.id)
      .eq("notes_professional", UPCOMING_NOTE)
      .maybeSingle();
    if (!upcoming) {
      await ensureSession(admin, {
        subscriptionId: sub.id as string,
        studentId: sub.student_id as string,
        professionalId: sub.professional_id as string,
        scheduledAt: new Date(Date.now() - 8 * 60_000).toISOString(),
        durationMin: 40,
        modality: sub.session_type === "video" ? "video" : "chat",
        status: "scheduled",
        notes: UPCOMING_NOTE,
      });
    }

    await admin
      .from("subscriptions")
      .update({
        session_type: sub.session_type === "video" ? "video" : "chat",
      })
      .eq("id", sub.id);

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", sub.student_id)
      .maybeSingle();
    filled.push({
      student: (profile?.full_name as string) || (profile?.email as string) || "student",
      plan: DEMO_FALLBACK_PLAN.title,
    });
  }
  return filled;
}

export async function seedDemoContent() {
  const admin = createAdminClient();
  const proIds: Record<string, string> = {};
  const proMeet: Record<string, string | null> = {};

  for (const pro of DEMO_PROFESSIONALS) {
    const id = await ensureDemoUser(admin, {
      email: pro.email,
      full_name: pro.full_name,
      role: "professional",
      gender: pro.gender,
    });
    proIds[pro.email] = id;
    proMeet[pro.email] = pro.default_meet_url;

    const { error: proError } = await admin.from("professionals").upsert(
      {
        profile_id: id,
        credentials: pro.credentials,
        specialties: [...pro.specialties],
        bio: pro.bio,
        approach: pro.approach,
        gender: pro.gender,
        tone: pro.tone,
        lgbtq_affirming: pro.lgbtq_affirming,
        faith_sensitive: pro.faith_sensitive,
        default_meet_url: pro.default_meet_url,
        verified: true,
      },
      { onConflict: "profile_id" },
    );
    if (proError) throw proError;

    const { data: existingNuggets } = await admin
      .from("nuggets")
      .select("title")
      .eq("professional_id", id);
    const titles = new Set((existingNuggets ?? []).map((n) => n.title as string));
    for (const nugget of pro.nuggets) {
      if (titles.has(nugget.title)) continue;
      const { error } = await admin.from("nuggets").insert({
        professional_id: id,
        title: nugget.title,
        body: nugget.body,
      });
      if (error) throw error;
    }
  }

  const groupsCreated: { name: string; id: string }[] = [];
  const groupByName: Record<string, string> = {};
  for (const community of DEMO_COMMUNITIES) {
    const adminId = proIds[community.admin_email];
    if (!adminId) continue;

    const { data: existing } = await admin
      .from("groups")
      .select("id, name")
      .eq("name", community.name)
      .eq("created_by", adminId)
      .maybeSingle();

    let groupId = existing?.id as string | undefined;
    if (!groupId) {
      const { data: group, error } = await admin
        .from("groups")
        .insert({
          name: community.name,
          description: community.description,
          tags: [...community.tags],
          created_by: adminId,
          member_cap: 40,
        })
        .select("id")
        .single();
      if (error) throw error;
      groupId = group.id;
    }

    groupsCreated.push({ name: community.name, id: groupId! });
    groupByName[community.name] = groupId!;
  }

  const students = [];
  for (const student of DEMO_STUDENTS) {
    const proId = proIds[student.professional_email];
    if (!proId) continue;
    students.push(
      await seedStudentPair(
        admin,
        student,
        proId,
        proMeet[student.professional_email] ?? null,
        groupByName[student.community_name],
      ),
    );
  }

  const extraPlans = await seedPlansForExistingSubs(
    admin,
    new Set(students.map((s) => s.id)),
  );

  return {
    professionals: DEMO_PROFESSIONALS.map((p) => ({
      email: p.email,
      name: p.full_name,
      id: proIds[p.email],
    })),
    students,
    extraPlans,
    communities: groupsCreated,
    password: DEMO_PASSWORD,
  };
}
