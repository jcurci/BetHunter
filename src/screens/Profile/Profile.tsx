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
import { NavigationProp } from '../../types/navigation';

const Profile: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="chevron-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Perfil</Text>
                    <View style={{ width: 24 }} />{/* Placeholder for spacing */}
                </View>

                {/* Profile Picture Section */}
                <View style={styles.profilePicSection}>
                    <Text style={styles.sectionTitle}>Foto de perfil</Text>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarPlaceholder} />
                        <TouchableOpacity style={styles.editIconContainer}>
                            <Icon name="edit-2" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity>
                        <Text style={styles.changePhotoText}>Alterar foto de perfil</Text>
                    </TouchableOpacity>
                </View>

                {/* Email Section */}
                <View style={styles.inputSection}>
                    <Text style={styles.sectionTitle}>Email</Text>
                    <View style={styles.inputFieldContainer}>
                        <TextInput
                            style={styles.input}
                            value="johndoe@email.com"
                            editable={false}
                            placeholderTextColor="#A0A0A0"
                        />
                        <TouchableOpacity style={styles.inputEditIcon}>
                            <Icon name="edit-2" size={18} color="#A09CAB" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Phone Section */}
                <View style={styles.inputSection}>
                    <Text style={styles.sectionTitle}>Telefone</Text>
                    <View style={styles.inputFieldContainer}>
                        <TextInput
                            style={styles.input}
                            value="(11) 99999-9999"
                            editable={false}
                            placeholderTextColor="#A0A0A0"
                        />
                        <TouchableOpacity style={styles.inputEditIcon}>
                            <Icon name="edit-2" size={18} color="#A09CAB" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Change Password Section */}
                <TouchableOpacity style={styles.changePasswordSection} onPress={() => navigation.navigate('ChangePassword')}>
                    <Icon name="lock" size={24} color="#FFFFFF" />
                    <View style={styles.passwordTextContainer}>
                        <Text style={styles.passwordTitle}>Trocar a senha</Text>
                        <Text style={styles.passwordSubtitle}>Troque sua senha a qualquer momento</Text>
                    </View>
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
    profilePicSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#A09CAB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#D0D0D0',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFA500',
        borderRadius: 20,
        padding: 8,
        borderWidth: 2,
        borderColor: '#000',
    },
    changePhotoText: {
        color: '#7456C8',
        fontSize: 14,
        fontWeight: 'bold',
    },
    inputSection: {
        marginBottom: 20,
    },
    inputFieldContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1C',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
    },
    inputEditIcon: {
        padding: 5,
    },
    changePasswordSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1C',
        borderRadius: 10,
        padding: 15,
        marginTop: 20,
    },
    passwordTextContainer: {
        marginLeft: 15,
        flex: 1,
    },
    passwordTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    passwordSubtitle: {
        fontSize: 14,
        color: '#A09CAB',
    },
});

export default Profile;
