import { THEMES } from '../../../lib/db';
import { loadAdmin } from '../data';
import AdminApp from '../AdminApp';

// One page for every admin menu: data is fetched once, AdminApp switches screens on the client.
export default async function AdminPage() {
  const data = await loadAdmin();
  return <AdminApp {...data} theme={data.theme || THEMES[0]} themes={THEMES} />;
}
