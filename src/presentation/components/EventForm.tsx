import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface EventFormProps {
  location: string;
  setLocation: (text: string) => void;
  duration: string;
  setDuration: (text: string) => void;
  damages: string;
  setDamages: (text: string) => void;
  date: string;
  setDate: (text: string) => void;
  onSave: () => void;
}

const EventForm = ({
  location,
  setLocation,
  duration,
  setDuration,
  damages,
  setDamages,
  date,
  setDate,
  onSave,
}: EventFormProps) => {
  return (
    <View style={styles.content}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Localização</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Ex: Bairro Centro, São Paulo"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Data do Evento</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="Ex: 01/01/2024"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Duração</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          placeholder="Ex: 2 horas"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Prejuízos</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={damages}
          onChangeText={setDamages}
          placeholder="Descreva os prejuízos observados"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveButtonText}>Salvar Evento</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventForm; 