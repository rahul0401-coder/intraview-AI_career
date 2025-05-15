"use client";

import Link from "next/link";
import { ModeToggle } from "./ModeToggle";
// import { CodeIcon } from "lucide-react";
// import { Codesandbox } from "lucide-react";

import { SignedIn, UserButton } from "@clerk/nextjs";
import DashboardBtn from "./DashboardBtn";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";

function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="border-b sticky top-0 bg-background z-40">
            <div className="flex h-16 items-center px-4 container mx-auto justify-between">
                {/* LEFT SIDE -LOGO */}
                <Link
                    href="/"
                    className="flex items-center gap-2 font-semibold text-2xl font-mono hover:opacity-80 transition-opacity"
                >
                    <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                        Intraview
                    </span>
                </Link>

                {/* MOBILE MENU BUTTON */}
                <button
                    className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <Menu className="h-6 w-6" />
                    )}
                </button>

                {/* DESKTOP NAV ITEMS */}
                <SignedIn>
                    <div className="hidden md:flex items-center space-x-4">
                        <DashboardBtn />
                        <ModeToggle />
                        <UserButton />
                    </div>
                </SignedIn>
            </div>

            {/* MOBILE MENU */}
            {mobileMenuOpen && (
                <div className="md:hidden py-4 px-4 border-t flex flex-col gap-4 bg-background">
                    <SignedIn>
                        <div className="flex flex-col gap-3">
                            <div className="w-full">
                                <DashboardBtn fullWidth={true} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <ModeToggle />
                                </div>
                                <div>
                                    <UserButton />
                                </div>
                            </div>
                        </div>
                    </SignedIn>
                </div>
            )}
        </nav>
    );
}
export default Navbar;
