export const matchesDepartment = (
  skillName: string,
  dept: { name: string; label?: string }
) => {
  const s = skillName.toLowerCase();
  const d = dept.name.toLowerCase();
  const l = dept.label?.toLowerCase() || "";

  if (!s || !d) return false;

  return (
    s.includes(d) ||
    (l && s.includes(l)) ||
    d.includes(s) ||
    (l && l.includes(s))
  );
};

// formatOceanScore removed (Unused)
