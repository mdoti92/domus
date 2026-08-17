import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../../constants/colors';
import { usePeople } from '../../../hooks/usePeople';
import { useUpdatePerson } from '../../../hooks/useUpdatePerson';
import { useDeletePerson } from '../../../hooks/useDeletePerson';
import { CreatePersonModal } from '../people/CreatePersonModal';
import { EditPersonModal } from '../people/EditPersonModal';
import { Person } from '../../../types';

export function PeopleManagementCard() {
  const { people, loading, createPerson, refetch } = usePeople();
  const { updatePerson } = useUpdatePerson();
  const { deletePerson } = useDeletePerson();
  const [createVisible, setCreateVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const handleDelete = async () => {
    if (!editingPerson) return;
    await deletePerson(editingPerson.id);
    setEditingPerson(null);
    await refetch();
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Personas</Text>
        <Pressable onPress={() => setCreateVisible(true)} accessibilityLabel="Agregar persona">
          <Text style={styles.addText}>+ Agregar</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.gold} />
      ) : people.length === 0 ? (
        <Text style={styles.emptyText}>Sin personas registradas todavía.</Text>
      ) : (
        <View style={styles.list}>
          {people.map((person) => (
            <Pressable key={person.id} style={styles.row} onPress={() => setEditingPerson(person)}>
              <Text style={styles.rowIcon}>{person.icon ?? '👤'}</Text>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{person.name}</Text>
                {person.relationship && <Text style={styles.rowMeta}>{person.relationship}</Text>}
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <CreatePersonModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSubmit={async (input) => { await createPerson(input); }}
      />

      {editingPerson && (
        <EditPersonModal
          visible={!!editingPerson}
          person={editingPerson}
          onClose={() => setEditingPerson(null)}
          onSubmit={async (input) => {
            await updatePerson(editingPerson.id, input);
            await refetch();
            setEditingPerson(null);
          }}
          onDelete={handleDelete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.silverDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  addText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.gold },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.silverMuted, fontStyle: 'italic' },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rowIcon: { fontSize: 20 },
  rowText: { flex: 1, gap: 1 },
  rowName: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.silver },
  rowMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.silverDim },
});
