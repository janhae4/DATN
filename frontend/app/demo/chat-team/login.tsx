import { Loader2 } from "lucide-react";
import { useState } from "react";
import { ApiService } from "../api-service";

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}
export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("chanhhy");
  const [password, setPassword] = useState("123123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await ApiService.login(email, password);
      const userInfo = await ApiService.getInfo();
      onLoginSuccess(userInfo);
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          {" "}
          Đăng nhập{" "}
        </h1>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-bold text-gray-600 block">
              {" "}
              Tên đăng nhập{" "}
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1"
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 block">
              {" "}
              Mật khẩu{" "}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white text-sm flex items-center justify-center"
          >
            {" "}
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              "Đăng nhập"
            )}{" "}
          </button>
        </form>
      </div>
    </div>
  );
}
