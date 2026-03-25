import InterestsManager from '@/components/dashboard/interests/InterestsManager';

export const metadata = {
  title: 'My Interests | Roomly',
  description: 'Manage the property and profile interests you have sent and received on Roomly.',
};

export default function InterestsPage() {
  return (
    <div className="flex-1 bg-navy-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col pt-16 lg:pt-8 min-h-[calc(100vh-80px)]">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-950 font-heading">
            My Interests
          </h1>
          <p className="text-navy-500 mt-1">
            Track property requests and profile interests across listings and people discovery.
          </p>
        </div>
        
        <div className="bg-white rounded-2xl border border-navy-100 shadow-sm flex-1 min-h-[500px] flex flex-col overflow-hidden">
          <InterestsManager />
        </div>
      </div>
    </div>
  );
}
