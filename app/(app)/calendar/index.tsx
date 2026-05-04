import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/firebase';
import type { EventDoc } from '@/types/models';
import { createEvent, deleteEvent } from '@/features/calendar/calendarService';

LocaleConfig.locales.he = {
  monthNames: [
    'ינואר',
    'פברואר',
    'מרץ',
    'אפריל',
    'מאי',
    'יוני',
    'יולי',
    'אוגוסט',
    'ספטמבר',
    'אוקטובר',
    'נובמבר',
    'דצמבר',
  ],
  monthNamesShort: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'],
  dayNames: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
  dayNamesShort: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
  today: 'היום',
};
LocaleConfig.defaultLocale = 'he';

export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const me = useAuthStore((s) => s.profile);
  const familyId = me?.familyId;
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [selected, setSelected] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (i18n.language !== 'he') LocaleConfig.defaultLocale = '';
    else LocaleConfig.defaultLocale = 'he';
  }, [i18n.language]);

  useEffect(() => {
    if (!familyId) return;
    const q = query(collection(db, 'families', familyId, 'events'), orderBy('startsAt', 'asc'));
    return onSnapshot(q, (qs) =>
      setEvents(qs.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EventDoc, 'id'>) }))),
    );
  }, [familyId]);

  const marked = useMemo(() => {
    const m: Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }> =
      {};
    events.forEach((ev) => {
      const d = ev.startsAt?.toDate?.();
      if (!d) return;
      const key = d.toISOString().slice(0, 10);
      m[key] = { ...(m[key] ?? {}), marked: true, dotColor: '#1f63f0' };
    });
    m[selected] = {
      ...(m[selected] ?? {}),
      selected: true,
      selectedColor: '#1f63f0',
    };
    return m;
  }, [events, selected]);

  const dayEvents = useMemo(() => {
    return events.filter((ev) => {
      const d = ev.startsAt?.toDate?.();
      return d && d.toISOString().slice(0, 10) === selected;
    });
  }, [events, selected]);

  const addEvent = async () => {
    if (!familyId || !me?.uid || !title.trim()) return;
    const d = new Date(selected + 'T12:00:00');
    try {
      await createEvent({
        familyId,
        uid: me.uid,
        title: title.trim(),
        startsAt: d,
        location: location.trim(),
        type: 'general',
      });
      setTitle('');
      setLocation('');
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : 'שגיאה');
    }
  };

  return (
    <Screen scrollable>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white text-right mb-2">
        {t('calendar.title')}
      </Text>
      <Calendar markedDates={marked} onDayPress={(d) => setSelected(d.dateString)} />

      <View className="mt-4 gap-2">
        <Text className="font-semibold text-gray-800 dark:text-gray-100 text-right">
          {t('calendar.newEvent')}
        </Text>
        <Input label={t('calendar.eventTitle')} value={title} onChangeText={setTitle} />
        <Input label={t('calendar.eventLocation')} value={location} onChangeText={setLocation} />
        <Button title={t('common.save')} onPress={() => void addEvent()} />
      </View>

      <Text className="text-lg font-semibold mt-6 text-right text-gray-900 dark:text-white">
        {t('calendar.upcoming')}
      </Text>
      <ScrollView className="max-h-72 mt-2">
        {dayEvents.length === 0 ? (
          <Text className="text-gray-500 text-center">אין אירועים ביום זה</Text>
        ) : null}
        {dayEvents.map((ev) => (
          <View
            key={ev.id}
            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-3 mb-2"
          >
            <Text className="text-base font-semibold text-right text-gray-900 dark:text-white">
              {ev.title}
            </Text>
            {ev.location ? (
              <Text className="text-sm text-gray-500 text-right">{ev.location}</Text>
            ) : null}
            <Pressable onPress={() => familyId && void deleteEvent(familyId, ev.id)}>
              <Text className="text-red-500 text-sm text-left">{t('common.delete')}</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
