import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

const ChangePassword = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="chevron-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Trocar senha</Text>
                    <View style={{ width: 24 }} />{/* Placeholder for spacing */}
                </View>

                {/* Current Password Input */}
                <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Senha atual</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                {/* New Password Input */}
                <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Senha nova</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        placeholder="Pelo menos 8 caracteres"
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                {/* Confirm New Password Input */}
                <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Confirme a senha</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        placeholder="Pelo menos 8 caracteres"
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                {/* Change Password Button */}
                <TouchableOpacity style={styles.changePasswordButton}>
                    <Text style={styles.buttonText}>Mudar senha</Text>
                </TouchableOpacity>

                {/* Forgot Password Link */}
                <TouchableOpacity style={styles.forgotPasswordLink}>
                    <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
                </TouchableOpacity>
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
    inputSection: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#1C1C1C',
        padding: 15,
        borderRadius: 10,
        color: '#FFFFFF',
        fontSize: 16,
    },
    changePasswordButton: {
        backgroundColor: '#7456C8',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 15,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    forgotPasswordLink: {
        alignItems: 'center',
    },
    forgotPasswordText: {
        color: '#A09CAB',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});

export default ChangePassword; 