import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '../../../constants/colors';
import { getCalendarMonthGrid, chunkIntoWeeks, toISODate, MONTH_NAMES, WEEKDAY_LABELS } from '../../../lib/calendarGrid';
import { DayItem } from '../../../lib/calendarDayActivity';
import { getCellPreview } from '../../../lib/calendarCellPreview';

interface MonthCalendarGridProps {
  getItemsForDate: (iso: string) => DayItem[];
  onSelectDay: (iso: string) => void;
}

// DOM-33: en pantallas angostas entran menos líneas de texto por celda antes
// de que se vuelva ilegible — se muestra 1 evento + "+N más" en vez de 2 (CA5).
const NARROW_SCREEN_BREAKPOINT = 400;

export function MonthCalendarGrid({ getItemsForDate, onSelectDay }: MonthCalendarGridProps) {
  const [viewedYear, setViewedYear] = useState(() => new Date().getUTCFullYear());
  const [viewedMonth, setViewedMonth] = useState(() => new Date().getUTCMonth());
  const { width } = useWindowDimensions();
  const maxVisible = width < NARROW_SCREEN_BREAKPOINT ? 1 : 2;

  const goToPreviousMonth = () => {
    if (viewedMonth === 0) {
      setViewedYear((y) => y - 1);
      setViewedMonth(11);
    } else {
      setViewedMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewedMonth === 11) {
      setViewedYear((y) => y + 1);
      setViewedMonth(0);
    } else {
      setViewedMonth((m) => m + 1);
    }
  };

  const weeks = chunkIntoWeeks(getCalendarMonthGrid(viewedYear, viewedMonth));
  const todayISO = toISODate(new Date());

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={goToPreviousMonth} style={styles.navButton} accessibilityLabel="Mes anterior">
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {MONTH_NAMES[viewedMonth]} {viewedYear}
        </Text>
        <Pressable onPress={goToNextMonth} style={styles.navButton} accessibilityLabel="Mes siguiente">
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={styles.weekdayLabel}>{label}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map(({ date, inCurrentMonth }) => {
              const iso = toISODate(date);
              const isToday = iso === todayISO;
              const { visibleItems, overflowCount } = getCellPreview(getItemsForDate(iso), maxVisible);

              return (
                <Pressable
                  key={iso}
                  onPress={() => onSelectDay(iso)}
                  style={styles.dayCell}
                  accessibilityLabel={iso}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      !inCurrentMonth && styles.dayNumberOutside,
                      isToday && styles.dayNumberToday,
                    ]}
                  >
                    {date.getUTCDate()}
                  </Text>

                  {visibleItems.map((item, index) => (
                    <Text
                      key={index}
                      style={[styles.eventLine, !inCurrentMonth && styles.eventLineOutside]}
                      numberOfLines={1}
                    >
                      {item.assetName}
                    </Text>
                  ))}

                  {overflowCount > 0 && <Text style={styles.overflowText}>+{overflowCount} más</Text>}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 20,
    color: Colors.gold,
    textTransform: 'capitalize',
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Colors.surface2,
  },
  navText: {
    fontSize: 18,
    color: Colors.gold,
    lineHeight: 20,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.silverMuted,
  },
  grid: {
    flexDirection: 'column',
    gap: 2,
  },
  week: {
    flexDirection: 'row',
    gap: 2,
  },
  dayCell: {
    flex: 1,
    minHeight: 64,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
    padding: 4,
    gap: 1,
  },
  dayNumber: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.silver,
  },
  dayNumberOutside: {
    color: Colors.silverMuted,
  },
  dayNumberToday: {
    color: Colors.gold,
  },
  eventLine: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.silverDim,
    backgroundColor: Colors.border,
    borderRadius: 3,
    paddingHorizontal: 3,
  },
  eventLineOutside: {
    opacity: 0.5,
  },
  overflowText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.silverMuted,
  },
});
