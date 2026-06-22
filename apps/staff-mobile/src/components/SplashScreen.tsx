export function SplashScreen({ message }: { message: string }) {
  return (
    <main className="splash-screen">
      <section className="splash-card">
        <p className="app-eyebrow">Bar Service</p>
        <h1>前台业务端</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}
