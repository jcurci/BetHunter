import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

const Notifications = () => {
    const navigation = useNavigation();
    const [newsEnabled, setNewsEnabled] = useState(true);
    const [investmentsEnabled, setInvestmentsEnabled] = useState(false);
    const [remindersEnabled, setRemindersEnabled] = useState(true);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="chevron-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Notificações</Text>
                    <View style={{ width: 24 }} />{/* Placeholder for spacing */}
                </View>

                {/* News Notification */}
                <View style={styles.notificationItem}>
                    <View style={styles.notificationTextContent}>
                        <Text style={styles.notificationTitle}>Notícias</Text>
                        <Text style={styles.notificationSubtitle}>
                            Seja notificado sempre que notícias novas sairem.
                        </Text>
                    </View>
                    <Switch
                        trackColor={{ false: "#767577", true: "#7456C8" }}
                        thumbColor={newsEnabled ? "#FFFFFF" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={setNewsEnabled}
                        value={newsEnabled}
                    />
                </View>

                {/* Investments Notification */}
                <View style={styles.notificationItem}>
                    <View style={styles.notificationTextContent}>
                        <Text style={styles.notificationTitle}>Investimentos</Text>
                        <Text style={styles.notificationSubtitle}>
                            Seja notificado sempre que oportunidades de investimento
                            interessantes surgirem
                        </Text>
                    </View>
                    <Switch
                        trackColor={{ false: "#767577", true: "#BF40BF" }} // Pink-like color for investments
                        thumbColor={investmentsEnabled ? "#FFFFFF" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={setInvestmentsEnabled}
                        value={investmentsEnabled}
                    />
                </View>

                {/* Reminders Notification */}
                <View style={styles.notificationItem}>
                    <View style={styles.notificationTextContent}>
                        <Text style={styles.notificationTitle}>Lembranças</Text>
                        <Text style={styles.notificationSubtitle}>
                            Seja notificado com lembretes para continuar sua iniciativa no
                            mundo dos investimentos ao longo do dia
                        </Text>
                    </View>
                    <Switch
                        trackColor={{ false: "#767577", true: "#7456C8" }}
                        thumbColor={remindersEnabled ? "#FFFFFF" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={setRemindersEnabled}
                        value={remindersEnabled}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    notificationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    notificationTextContent: {
        flex: 1,
        marginRight: 10,
    },
    notificationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 5,
    },
    notificationSubtitle: {
        fontSize: 14,
        color: '#A09CAB',
    },
});

export default Notifications; 