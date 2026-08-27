import { notFound } from "next/navigation";
import CourseOverview, { type CourseOverviewData } from "@/components/CourseOverview";
import { getCourse } from "@/lib/lessons";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course: courseId } = await params;
  const course = getCourse(courseId);
  if (!course) notFound();

  // The overview is a Client Component (the language picker needs state and
  // localStorage), so hand it only the fields it renders — not the lessons'
  // full notes, which would otherwise be serialized into the page payload.
  const data: CourseOverviewData = {
    id: course.id,
    title: course.title,
    tagline: course.tagline,
    languages: course.languages,
    modules: course.modules.map((m) => ({ id: m.id, title: m.title, blurb: m.blurb })),
    lessons: course.lessons.map((l) => ({
      id: l.id,
      module: l.module,
      title: l.title,
      blurb: l.blurb,
    })),
  };

  return <CourseOverview course={data} />;
}
