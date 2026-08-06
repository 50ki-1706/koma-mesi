"use client";

import Image from "next/image";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import Button from "@/shared/components/Button/Button";
import TransparentButton from "@/shared/components/TransparentButton/TransparentButton";

export default function Home() {
  const { data: session, isPending } = useSession();

  return (
    <main className="flex flex-1 flex-col items-center gap-8 sm:gap-12 w-full max-w-3xl mx-auto px-6 sm:px-16 py-10 sm:py-32 sm:items-start">
      {isPending ? (
        <div className="h-10 w-40 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      ) : session ? (
        <TransparentButton
          borderRadius="999px"
          className="h-10 px-5 border-black/8 dark:border-white/[.145] text-zinc-950 dark:text-zinc-50 hover:bg-black/4 dark:hover:bg-[#1a1a1a]"
          onClick={() => signOut()}
        >
          ログアウト
        </TransparentButton>
      ) : (
        <Button
          borderRadius="999px"
          className="h-10 px-5 bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          onClick={() => signIn.social({ provider: "google" })}
        >
          Google でログイン
        </Button>
      )}

      <Image
        className="dark:invert w-full max-w-25 h-auto"
        src="/next.svg"
        alt="Next.js logo"
        width={100}
        height={20}
        priority
      />
      <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
        <h1 className="max-w-xs text-3xl font-semibold leading-9 tracking-tight text-black dark:text-zinc-50">
          To get started, edit the page.tsx file.
        </h1>
        <p className="max-w-md text-lg leading-7 text-zinc-600 dark:text-zinc-400">
          Looking for a starting point or more instructions? Head over to{" "}
          <a
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            className="font-medium text-zinc-950 dark:text-zinc-50"
          >
            Templates
          </a>{" "}
          or the{" "}
          <a
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            className="font-medium text-zinc-950 dark:text-zinc-50"
          >
            Learning
          </a>{" "}
          center.
        </p>
      </div>
      <div className="flex flex-col gap-6 text-base font-medium">
        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-39.5"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/8 px-5 transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-39.5"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>

        {session?.user ? (
          <section className="space-y-3 rounded-2xl border border-solid border-black/8 p-4 text-sm text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
            <h2 className="text-base font-medium text-black dark:text-zinc-50">
              ユーザー情報
            </h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-[auto,1fr]">
              <dt className="font-medium text-black dark:text-zinc-50">id</dt>
              <dd className="break-all">{session.user.id}</dd>
              <dt className="font-medium text-black dark:text-zinc-50">name</dt>
              <dd className="break-all">{session.user.name}</dd>
              <dt className="font-medium text-black dark:text-zinc-50">
                email
              </dt>
              <dd className="break-all">{session.user.email}</dd>
              <dt className="font-medium text-black dark:text-zinc-50">
                emailVerified
              </dt>
              <dd className="break-all">
                {String(session.user.emailVerified)}
              </dd>
              <dt className="font-medium text-black dark:text-zinc-50">
                image
              </dt>
              <dd className="break-all">{String(session.user.image)}</dd>
              <dt className="font-medium text-black dark:text-zinc-50">
                createdAt
              </dt>
              <dd className="break-all">{String(session.user.createdAt)}</dd>
              <dt className="font-medium text-black dark:text-zinc-50">
                updatedAt
              </dt>
              <dd className="break-all">{String(session.user.updatedAt)}</dd>
            </dl>
          </section>
        ) : null}
      </div>
    </main>
  );
}
