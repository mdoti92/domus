import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../constants/colors';
import { GoogleCalendarConnectionCard } from '../components/modules/settings/GoogleCalendarConnectionCard';
import { PeopleManagementCard } from '../components/modules/settings/PeopleManagementCard';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GoogleCalendarConnectionCard />
        <PeopleManagementCard />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 20,
    gap: 20,
  },
});
