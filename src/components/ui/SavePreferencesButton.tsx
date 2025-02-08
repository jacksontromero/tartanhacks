import { useRouter } from 'next/router';

const SavePreferencesButton = () => {
    const router = useRouter();

    const handleSave = async () => {
        // Logic to save preferences
        await savePreferences(); // Implement this function
        router.push('/preferences'); // Redirect to preferences page after saving
    };

    return (
        <Button onClick={handleSave}>
            Save Preferences
        </Button>
    );
};

export default SavePreferencesButton; 