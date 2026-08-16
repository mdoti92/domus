import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { getCalendarMonthGrid, chunkIntoWeeks, toISODate } from '../../lib/calendarGrid';

interface CalendarProps {
  value: string | null;
  onSelect: (isoDate: string) => void;
  markedDates?: Set<string>;
}

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function parseViewedDate(value: string | null): Date {
  if (value) {
    const parsed = new Date(value.includes('T') ? value : `${value}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export function Calendar({ value, onSelect, markedDates }: CalendarProps) {
  const initial = parseViewedDate(value);
  const [viewedYear, setViewedYear] = useState(initial.getUTCFullYear());
  const [viewedMonth, setViewedMonth] = useState(initial.getUTCMonth());

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
  const selectedISO = value ? toISODate(parseViewedDate(value)) : null;
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
              const isSelected = iso === selectedISO;
              const isToday = iso === todayISO;
              const isMarked = markedDates?.has(iso) ?? false;
              return (
                <Pressable
                  key={iso}
                  onPress={() => onSelect(iso)}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  accessibilityLabel={iso}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !inCurrentMonth && styles.dayTextOutside,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday,
                    ]}
                  >
                    {date.getUTCDate()}
                  </Text>
                  {isMarked && (
                    <View
                      style={[styles.marker, isSelected && styles.markerSelected]}
                      accessibilityLabel={`${iso}-con-actividad`}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const CELL_SIZE = 36;

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
    justifyContent: 'space-between',
  },
  weekdayLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.silverMuted,
  },
  grid: {
    flexDirection: 'column',
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CELL_SIZE / 2,
    marginBottom: 4,
    position: 'relative',
  },
  marker: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
  markerSelected: {
    backgroundColor: Colors.bg,
  },
  dayCellSelected: {
    backgroundColor: Colors.gold,
  },
  dayText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.silver,
  },
  dayTextOutside: {
    color: Colors.silverMuted,
  },
  dayTextSelected: {
    color: Colors.bg,
    fontFamily: 'Inter_500Medium',
  },
  dayTextToday: {
    color: Colors.gold,
    fontFamily: 'Inter_500Medium',
  },
});
