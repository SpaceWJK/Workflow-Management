/**
 * 대한민국 공휴일 데이터 (2025~2027)
 * 음력 공휴일(설날, 추석, 부처님오신날)은 연도별 양력 날짜로 변환
 */

interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

// 고정 공휴일 (매년 동일)
const FIXED_HOLIDAYS: Array<{ month: number; day: number; name: string }> = [
  { month: 1, day: 1, name: '신정' },
  { month: 3, day: 1, name: '삼일절' },
  { month: 5, day: 5, name: '어린이날' },
  { month: 6, day: 6, name: '현충일' },
  { month: 8, day: 15, name: '광복절' },
  { month: 10, day: 3, name: '개천절' },
  { month: 10, day: 9, name: '한글날' },
  { month: 12, day: 25, name: '성탄절' },
];

// 음력 기반 공휴일 (양력 변환, 연도별)
const LUNAR_HOLIDAYS: Record<number, Holiday[]> = {
  2025: [
    { date: '2025-01-28', name: '설날 연휴' },
    { date: '2025-01-29', name: '설날' },
    { date: '2025-01-30', name: '설날 연휴' },
    { date: '2025-05-05', name: '부처님오신날' }, // 어린이날과 겹침
    { date: '2025-10-05', name: '추석 연휴' },
    { date: '2025-10-06', name: '추석' },
    { date: '2025-10-07', name: '추석 연휴' },
    { date: '2025-10-08', name: '대체공휴일(추석)' },
  ],
  2026: [
    { date: '2026-02-16', name: '설날 연휴' },
    { date: '2026-02-17', name: '설날' },
    { date: '2026-02-18', name: '설날 연휴' },
    { date: '2026-05-24', name: '부처님오신날' },
    { date: '2026-09-24', name: '추석 연휴' },
    { date: '2026-09-25', name: '추석' },
    { date: '2026-09-26', name: '추석 연휴' },
    { date: '2026-03-02', name: '대체공휴일(삼일절)' },
    { date: '2026-08-17', name: '대체공휴일(광복절)' },
    { date: '2026-10-12', name: '대체공휴일(한글날)' },
  ],
  2027: [
    { date: '2027-02-06', name: '설날 연휴' },
    { date: '2027-02-07', name: '설날' },
    { date: '2027-02-08', name: '설날 연휴' },
    { date: '2027-02-09', name: '대체공휴일(설날)' },
    { date: '2027-05-13', name: '부처님오신날' },
    { date: '2027-09-14', name: '추석 연휴' },
    { date: '2027-09-15', name: '추석' },
    { date: '2027-09-16', name: '추석 연휴' },
  ],
};

/**
 * 특정 연도의 공휴일 목록을 반환
 */
export function getHolidaysForYear(year: number): Holiday[] {
  const fixed = FIXED_HOLIDAYS.map(h => ({
    date: `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`,
    name: h.name,
  }));

  const lunar = LUNAR_HOLIDAYS[year] || [];

  return [...fixed, ...lunar];
}

/**
 * 날짜 → 공휴일 이름 매핑 (빠른 조회용)
 */
export function getHolidayMap(year: number): Map<string, string> {
  const map = new Map<string, string>();
  for (const h of getHolidaysForYear(year)) {
    // 같은 날에 여러 공휴일이 있을 수 있음 (어린이날+부처님오신날)
    const existing = map.get(h.date);
    map.set(h.date, existing ? `${existing} / ${h.name}` : h.name);
  }
  return map;
}
