import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { COURSE } from "@/data/course";
import { useProgress } from "@/store/useProgress";
import { CheckCircle2, Play } from "lucide-react";

export const Route = createFileRoute("/curso")({
  head: () => ({
    meta: [
      { title: "CSLE — Curso A1 → B2" },
      { name: "description", content: "A linha central do método CSLE. Avance do A1 ao B2." },
    ],
  }),
  component: CursoGuarded,
});

function Curso() {
  const { completedLessons, currentLevel } = useProgress();

  return (
    <AppShell>
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold">Curso CSLE</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A linha central do método. Avance do A1 ao B2.
        </p>
      </div>

      <div className="space-y-6 px-5 pt-2">
        {COURSE.map((level) => {
          const lessonsInLevel = level.units.flatMap((u) => u.lessons);
          const completed = lessonsInLevel.filter((l) => completedLessons.includes(l.id)).length;
          const pct = Math.round((completed / lessonsInLevel.length) * 100);
          const isCurrent = level.id === currentLevel;

          return (
            <section key={level.id}>
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    {level.title}
                    {isCurrent && (
                      <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                        Atual
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-muted-foreground">{level.subtitle_pt}</p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {completed}/{lessonsInLevel.length}
                </span>
              </div>

              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-primary transition-smooth"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="space-y-3">
                {level.units.map((unit) => {
                  const unitCompleted = unit.lessons.filter((l) =>
                    completedLessons.includes(l.id),
                  ).length;
                  const allDone = unitCompleted === unit.lessons.length;
                  return (
                    <div key={unit.id} className="rounded-2xl bg-card shadow-soft">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="text-2xl">{unit.icon}</div>
                        <div className="flex-1">
                          <div className="font-semibold">{unit.title}</div>
                          <div className="text-xs text-muted-foreground">{unit.subtitle_pt}</div>
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground">
                          {unitCompleted}/{unit.lessons.length}
                        </div>
                      </div>
                      <div className="border-t border-border">
                        {unit.lessons.map((lesson) => {
                          const done = completedLessons.includes(lesson.id);
                          return (
                            <Link
                              key={lesson.id}
                              to="/licao/$levelId/$unitId/$lessonId"
                              params={{
                                levelId: level.id,
                                unitId: unit.id,
                                lessonId: lesson.id,
                              }}
                              className="flex items-center gap-3 px-4 py-3 transition-smooth active:bg-muted/50"
                            >
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                  done
                                    ? "bg-success/20 text-success"
                                    : "bg-primary/15 text-primary"
                                }`}
                              >
                                {done ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{lesson.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {lesson.goal_pt}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      {allDone && (
                        <div className="border-t border-border px-4 py-2 text-center text-xs font-semibold text-success">
                          ✓ Unidade completa
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}

function CursoGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Curso />
    </RequireAuth>
  );
}
