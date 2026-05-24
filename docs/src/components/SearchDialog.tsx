'use client';

import { useDocsSearch } from 'fumadocs-core/search/client';
import { usePathname } from 'next/navigation';
import { 
  SearchDialog, SearchDialogContent, SearchDialogInput, 
  SearchDialogList, SearchDialogOverlay, type SharedProps,
  SearchDialogHeader, SearchDialogIcon, SearchDialogClose
} from 'fumadocs-ui/components/dialog/search';

export default function CustomSearchDialog(props: SharedProps) {
  const pathname = usePathname();
  const isV1 = pathname?.startsWith('/docs/v1');
  const tag = isV1 ? 'v1' : 'v2';

  const { search, setSearch, query } = useDocsSearch({ 
    type: 'static',
    tag,
  });

  return (
    <SearchDialog 
      {...props}
      search={search} 
      onSearchChange={setSearch} 
      isLoading={query.isLoading} 
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== 'empty' ? query.data : null} />
      </SearchDialogContent>
    </SearchDialog>
  );
}
