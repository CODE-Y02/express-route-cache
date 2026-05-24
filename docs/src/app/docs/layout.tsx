import { source } from '@/lib/source';
import DocsLayoutWrapper from './DocsLayoutWrapper';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayoutWrapper tree={source.getPageTree()}>
      {children}
    </DocsLayoutWrapper>
  );
}
