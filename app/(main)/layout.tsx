import AppNavbar from "@/components/templates/app-navbar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <div className="flex flex-col items-center justify-between mx-auto h-screen">
        <div className="w-full shadow">
          <AppNavbar />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
