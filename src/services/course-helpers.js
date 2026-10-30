export function getVideoPreview(lesson) {
  if (!lesson) return '';
  if (lesson.courseThumbnail) return lesson.courseThumbnail;
  if (lesson.thumbnail) return lesson.thumbnail;
  return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
}

export function getCategoryIcon(category) {
  const name = String(category || '').toLowerCase();
  if (name.includes('ai') || name.includes('artificial')) return 'fa-solid fa-wand-magic-sparkles';
  if (name.includes('design')) return 'fa-solid fa-palette';
  if (name.includes('code') || name.includes('dev') || name.includes('programming')) return 'fa-solid fa-code';
  if (name.includes('business') || name.includes('marketing')) return 'fa-solid fa-briefcase';
  if (name.includes('finance') || name.includes('account') || name.includes('money')) return 'fa-solid fa-wallet';
  if (name.includes('data')) return 'fa-solid fa-chart-line';
  if (name.includes('photo') || name.includes('video')) return 'fa-solid fa-camera';
  if (name.includes('music')) return 'fa-solid fa-music';
  if (name.includes('language')) return 'fa-solid fa-language';
  return 'fa-solid fa-book-open';
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('fr-BI', {
    style: 'currency',
    currency: 'BIF',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function getCategories(courses) {
  const grouped = (courses || []).reduce((accumulator, course) => {
    const key = course.category || 'General';
    if (!accumulator[key]) {
      accumulator[key] = {
        name: key,
        count: 0,
        courseCount: 0,
        spotlight: course.thumbnail,
      };
    }
    accumulator[key].count += 1;
    accumulator[key].courseCount += 1;
    return accumulator;
  }, {});

  return Object.values(grouped).sort((left, right) => right.count - left.count);
}

export function flattenLessons(courses) {
  return (courses || []).flatMap((course) =>
    (course.curriculum || [])
      .filter((lesson) => lesson.type === 'video')
      .map((lesson, index) => ({
        id: `${course.id}-${index}`,
        courseId: course.id,
        courseTitle: course.title,
        courseThumbnail: course.thumbnail,
        category: course.category,
        level: course.level,
        lessonIndex: index,
        lessonTitle: lesson.title,
        duration: lesson.duration,
        youtubeId: lesson.youtubeId || '',
        freePreview: Boolean(lesson.freePreview),
      })),
  );
}

export function getCourseById(courses, id) {
  return (courses || []).find((course) => String(course.id) === String(id)) || null;
}

export function getCourseProgress(course, progressMap) {
  const courseLessons = course?.curriculum || [];
  const courseEntries = Object.values(progressMap || {}).filter(
    (entry) => entry.courseId === course?.id,
  );

  if (!courseEntries.length || !courseLessons.length) {
    return {
      completedLessons: 0,
      progressPercent: 0,
      resumeEntry: null,
    };
  }

  const completedLessons = courseEntries.filter(
    (entry) => Number(entry.progressPercent || 0) >= 95,
  ).length;
  const resumeEntry = [...courseEntries].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )[0];

  return {
    completedLessons,
    progressPercent: Math.min(
      100,
      Math.round((completedLessons / Math.max(courseLessons.length, 1)) * 100),
    ),
    resumeEntry,
  };
}

export function buildDiscoverCollections(courses) {
  const categories = getCategories(courses);
  return categories.map((category) => ({
    ...category,
    courses: (courses || []).filter((course) => course.category === category.name),
  }));
}
