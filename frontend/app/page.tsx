import Header from "@/components/Header";

export default function HomePage() {
  return (
    <>
      <Header />

      <div className="px-6 py-8 text-[#ececec]">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold mb-3">Home</h1>
          <p className="text-slate-300 max-w-2xl">
            Welcome to 30cent — your AI personal finance companion.
          </p>
        </div>
      </div>
    </>
  );
}