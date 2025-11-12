import AppNavbar from "@/components/templates/app-navbar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      <AppNavbar />
      <div className="pt-16">
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;
