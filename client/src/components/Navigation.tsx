import { Link } from "wouter";
import { ConnectWallet } from "./ConnectWallet";

export function Navigation() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold">Help Mutual System Test</h1>
          <nav>
            <ul className="flex gap-4">
              <li>
                <Link href="/">
                  <span className="text-sm font-medium hover:text-primary cursor-pointer">Home</span>
                </Link>
              </li>
              <li>
                <Link href="/analytics">
                  <span className="text-sm font-medium hover:text-primary cursor-pointer">Analytics</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <ConnectWallet />
      </div>
    </header>
  );
}