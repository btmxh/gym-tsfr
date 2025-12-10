"use client";

import Link from "next/link";
import Logo from "./logo";
import { useEffect, useState } from "react";
import ThemeController from "./theme-controller";
import LanguageController from "./lang-controller";
import {
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  CubeIcon,
  CurrencyDollarIcon,
  FlagIcon,
  UserGroupIcon,
  UserPlusIcon,
} from "@heroicons/react/24/solid";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const routes = [
    ["Dashboard", "/dashboard", ChartPieIcon],
    ["Staff", "/staff", UserGroupIcon],
    ["Packages", "/packages", CubeIcon],
    ["Memberships", "/memberships", UserPlusIcon],
    ["Feedbacks", "/feedbacks", ChatBubbleLeftRightIcon],
    ["Purchases", "/purchases", CurrencyDollarIcon],
    ["Reports", "/reports", FlagIcon],
  ] satisfies [string, string, React.FC][];

  const pathname = usePathname();

  const navItems = routes.map(([name, path, RouteIcon]) => {
    const current = path.split("/")[1] === pathname.split("/")[1];
    return (
      <li key={path}>
        <Link href={path} className="group">
          <div className="flex gap-1 relative">
            <RouteIcon className={`size-6 ${current ? "text-primary" : ""}`} />
            <span className={current ? "text-primary" : ""}>{name}</span>
            <div
              className={`absolute h-0.5 -bottom-1 -left-1 -right-1 ${current ? "bg-primary" : "bg-base-content origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"}`}
            ></div>
          </div>
        </Link>
      </li>
    );
  });

  return (
    <header className="navbar">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {" "}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />{" "}
            </svg>
          </div>

          <ul
            tabIndex={-1}
            className="menu menu-lg dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
          >
            {navItems}
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost text-xl">
          <Logo className="text-primary w-[1em] h-[1em]" />
          <i className="italic">
            Gym
            <span className="text-emerald-500/70">Embrace</span>
          </i>
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 text-lg">{navItems}</ul>
      </div>
      <div className="navbar-end flex gap-2">
        <LanguageController />
        <ThemeController />
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            className="btn btn-circle btn-ghost avatar avatar-placeholder avatar-online"
          >
            <div className="ring-primary ring-offset-base-100 w-8 rounded-full ring-2 ring-offset-2 inline">
              <span className="text-xl text-center align-middle">A</span>
            </div>
          </div>
          <div
            tabIndex={-1}
            className="menu menu-sm dropdown-content bg-base-100 z-1 mt-3 w-24 p-2 shadow"
          >
            <ul></ul>
          </div>
        </div>
      </div>
    </header>
  );
}
