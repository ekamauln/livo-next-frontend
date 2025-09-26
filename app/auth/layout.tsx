const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <div className="flex flex-col items-center justify-between mx-auto h-screen">
        <div className="w-full shadow">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
