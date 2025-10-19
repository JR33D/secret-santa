"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Tabs from "@/components/Tabs";
import PeopleTab from "@/components/PeopleTab";
import PoolsTab from "@/components/PoolsTab";
import WishlistTab from "@/components/WishlistTab";
import RestrictionsTab from "@/components/RestrictionsTab";
import GenerateTab from "@/components/GenerateTab";
import HistoryTab from "@/components/HistoryTab";
import EmailTab from "@/components/EmailTab";
import UsersTab from "@/components/UsersTab";
import MyWishlistTab from "@/components/MyWishlistTab";
import ReceiverWishlistTab from "@/components/ReceiverWishlistTab";

export default function Page() {
  const { data: session } = useSession();
  const [active, setActive] = useState("");

  if (!session) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const user = session.user as any;
  const isAdmin = user.role === "admin";

  // Admin tabs
  const adminTabs = [
    { id: "pools", label: "🏊 Pools" },
    { id: "people", label: "👥 People" },
    { id: "users", label: "🔐 Users" },
    { id: "wishlist", label: "🎁 Wishlists" },
    { id: "restrictions", label: "🚫 Restrictions" },
    { id: "generate", label: "✨ Generate" },
    { id: "history", label: "📊 History" },
    { id: "email", label: "📧 Email Config" },
  ];

  // User tabs
  const userTabs = [
    { id: "my-wishlist", label: "🎁 My Wishlist" },
    { id: "receiver-wishlist", label: "🎅 Their Wishlist" },
  ];

  const tabs = isAdmin ? adminTabs : userTabs;

  // Set default active tab
  if (!active) {
    setActive(tabs[0].id);
  }

  return (
    <>
      <Tabs tabs={tabs} active={active} onChange={setActive} />
      <div>
        {/* Admin tabs */}
        {isAdmin && (
          <>
            {active === "pools" && <PoolsTab />}
            {active === "people" && <PeopleTab />}
            {active === "users" && <UsersTab />}
            {active === "wishlist" && <WishlistTab />}
            {active === "restrictions" && <RestrictionsTab />}
            {active === "generate" && <GenerateTab />}
            {active === "history" && <HistoryTab />}
            {active === "email" && <EmailTab />}
          </>
        )}

        {/* User tabs */}
        {!isAdmin && (
          <>
            {active === "my-wishlist" && <MyWishlistTab />}
            {active === "receiver-wishlist" && <ReceiverWishlistTab />}
          </>
        )}
      </div>
    </>
  );
}