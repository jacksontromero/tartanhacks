import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';

const Navbar = () => {
    const router = useRouter();

    return (
        <div>
            <Button onClick={() => router.push('/preferences')}>
                Preferences
            </Button>
        </div>
    );
};

export default Navbar; 