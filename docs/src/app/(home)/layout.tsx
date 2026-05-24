import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { homeOptions } from '@/lib/layout.shared';
import Navbar from '@/components/Navbar';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout 
      {...homeOptions()} 
      nav={{
        component: <Navbar />,
      }}
    >
      {children}
    </HomeLayout>
  );
}
