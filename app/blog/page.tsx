
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import Footer from "@/app/components/Footer";
import { client, urlFor } from "@/lib/sanityClient";
import { allPostsQuery } from "@/lib/sanityQueries";
import { BlogPost } from "@/lib/types/blog";

export const metadata: Metadata = {
  title: "Zodiac Datn Shop Blog | 3D Zodiac Compatibility Shirts",
  description:
    "Discover Zodiac Datn Shop's signature 3D emoji zodiac compatibility shirts. Wear your sign, show what you're looking for, match with your partner, and find your cosmic connection.",
  openGraph: {
    title: "Zodiac Datn Shop | Wear Your Zodiac. Find Your Match.",
    description:
      "Meet the signature 3D emoji zodiac compatibility shirts made for singles, couples, astrology lovers, and unforgettable gifts.",
    type: "website",
  },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BlogSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex flex-col gap-4 animate-pulse">
          <div className="w-full aspect-[3/2] bg-gray-900 rounded-xl" />
          <div className="h-3 bg-gray-800 rounded w-1/3" />
          <div className="h-5 bg-gray-800 rounded w-3/4" />
          <div className="h-3 bg-gray-800 rounded w-full" />
          <div className="h-3 bg-gray-800 rounded w-5/6" />
        </div>
      ))}
    </div>
  );
}

function LaunchArticle() {
  return (
    <article className="max-w-4xl mx-auto mb-24">
      <div className="border border-gray-800 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-purple-950 via-black to-pink-950 px-6 py-16 md:px-14 md:py-24 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-pink-300 mb-6">
            Introducing Zodiac Datn Shop
          </p>

          <h2 className="text-4xl md:text-6xl font-[family-name:var(--font-exo2)] font-bold leading-tight">
            YOUR SIGN.
            <br />
            YOUR ENERGY.
            <br />
            YOUR MATCH.
          </h2>

          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto mt-6 leading-relaxed">
            A new way to wear your zodiac sign, express your personality,
            and let the universe do the introductions.
          </p>

          <div className="mt-8 flex justify-center flex-wrap gap-3">
            <span className="border border-white/20 rounded-full px-4 py-2 text-xs uppercase tracking-widest">
              3D Emoji Design
            </span>
            <span className="border border-white/20 rounded-full px-4 py-2 text-xs uppercase tracking-widest">
              Zodiac Compatibility
            </span>
            <span className="border border-white/20 rounded-full px-4 py-2 text-xs uppercase tracking-widest">
              Made to Match
            </span>
          </div>
        </div>

        <div className="px-6 py-10 md:px-14 md:py-14">
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-widest text-gray-500 mb-8">
            <span className="text-pink-400">Shop Launch</span>
            <span>·</span>
            <span>Zodiac Culture</span>
            <span>·</span>
            <span>Astrology & Style</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-[family-name:var(--font-exo2)] font-bold leading-tight mb-8">
            Meet the Zodiac Compatibility Shirt: The Shirt That Says What
            Words Sometimes Can't
          </h1>

          <div className="space-y-6 text-gray-300 leading-8 text-sm md:text-base">
            <p>
              What if your outfit could introduce you before you even said
              hello? What if someone could spot your zodiac sign across the
              room, recognize your energy, and instantly have something to
              talk about?
            </p>

            <p>
              That's the idea behind <strong className="text-white">Zodiac Datn Shop</strong>.
              We're bringing astrology, personality, fashion, and social
              connection together through our signature 3D emoji zodiac
              compatibility shirts.
            </p>

            <p>
              These aren't just zodiac shirts with a birthday sign printed
              across the front. They're conversation starters designed to
              make your zodiac identity visible, whether you're single,
              happily coupled, or simply someone who loves astrology.
            </p>

            <h2 className="text-2xl md:text-3xl text-white font-[family-name:var(--font-exo2)] font-bold pt-6">
              1. The Signature 3D Emoji Zodiac Design
            </h2>

            <p>
              Every zodiac sign has its own personality, symbolism, and
              reputation. Zodiac Datn Shop transforms that identity into
              expressive 3D emoji-inspired designs that make your sign
              recognizable, playful, and wearable.
            </p>

            <p>
              From Aries energy to Pisces intuition, the designs give
              astrology fans a fun way to represent their sign without
              needing to explain their entire birth chart.
            </p>

            <p>
              The signature concept is simple: your zodiac sign becomes
              part of your everyday style. It's fashion with personality
              and a little cosmic attitude.
            </p>

            <h2 className="text-2xl md:text-3xl text-white font-[family-name:var(--font-exo2)] font-bold pt-6">
              2. Single? Let Your Zodiac Shirt Do the Introducing.
            </h2>

            <p>
              Dating doesn't always have to start with a dating app.
              Sometimes the best introductions happen naturally.
            </p>

            <p>
              Your zodiac shirt can act as a wearable introduction.
              Represent your sign, show your personality, and give
              someone who shares your interest in astrology an easy
              reason to start a conversation.
            </p>

            <p>
              Imagine wearing your Leo shirt and meeting someone who
              immediately tells you they're an Aquarius. Or spotting
              another Scorpio across the room. Suddenly, there's a
              conversation waiting to happen.
            </p>

            <p>
              It's also a fun way to signal the type of energy you're
              interested in. Think of it as a conversation starter,
              not a guarantee of romantic compatibility. Real
              connections are about much more than star signs.
            </p>

            <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 my-8">
              <p className="text-pink-400 text-xs uppercase tracking-widest mb-3">
                The Single Life
              </p>
              <p className="text-white text-xl font-semibold mb-2">
                Wear your sign. Attract a conversation.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your next introduction might start with three simple
                words: What's your sign?
              </p>
            </div>

            <h2 className="text-2xl md:text-3xl text-white font-[family-name:var(--font-exo2)] font-bold pt-6">
              3. Couples: Two Signs. One Connection.
            </h2>

            <p>
              Already found your person? Zodiac compatibility shirts
              make matching outfits more personal.
            </p>

            <p>
              Instead of wearing identical shirts, couples can wear
              their individual zodiac signs together. One person
              represents their sign, the other represents theirs.
              The two shirts become a matching set that celebrates
              both personalities.
            </p>

            <p>
              Whether you're a Taurus and Cancer, Gemini and Libra,
              or two signs with completely different reputations,
              your matching shirts tell a story about your connection.
            </p>

            <p>
              They're perfect for date nights, vacations, birthdays,
              couple photos, anniversaries, and casual everyday style.
            </p>

            <h2 className="text-2xl md:text-3xl text-white font-[family-name:var(--font-exo2)] font-bold pt-6">
              4. From TikTok to Real-World Zodiac Culture
            </h2>

            <p>
              TikTok has become a major place for discovering fashion,
              personality trends, astrology content, and products that
              people love to share.
            </p>

            <p>
              Zodiac Datn Shop shirts are designed to fit naturally
              into that culture. Their expressive 3D emoji aesthetic
              makes them a fun subject for outfit videos, zodiac
              reactions, compatibility conversations, and couple
              content.
            </p>

            <p>
              Look for Zodiac Datn Shop content and product showcases
              on TikTok, where creators and customers can show off
              their signs, compare zodiac combinations, and share
              their favorite designs.
            </p>

            <p>
              The concept also connects with celebrity and influencer
              fashion culture, where astrology, personal identity,
              statement clothing, and expressive outfits regularly
              inspire conversations.
            </p>

            <p>
              Whether you discovered zodiac fashion through a celebrity,
              an influencer, a viral video, or a friend, the goal is
              the same: make your sign part of your style.
            </p>

            <h2 className="text-2xl md:text-3xl text-white font-[family-name:var(--font-exo2)] font-bold pt-6">
              5. A Zodiac Gift That Makes Choosing Easy
            </h2>

            <p>
              Buying gifts can be surprisingly difficult. You want
              something personal, thoughtful, and fun without having
              to guess someone's exact fashion taste or personal
              preferences.
            </p>

            <p>
              That's what makes zodiac shirts such an easy gift idea
              for people who enjoy astrology, spirituality, horoscopes,
              and zodiac culture.
            </p>

            <p>
              You don't have to know their favorite color, favorite
              celebrity, or current fashion trend. If you know their
              birthday, you can usually identify their sun sign and
              start with a gift that has personal meaning.
            </p>

            <p>
              They're a fun choice for:
            </p>

            <ul className="list-disc pl-6 space-y-3 text-gray-300">
              <li>Birthdays and zodiac season celebrations</li>
              <li>Valentine's Day and romantic surprises</li>
              <li>Anniversaries and matching couple gifts</li>
              <li>Christmas and holiday gifting</li>
              <li>Friends who love astrology and spirituality</li>
              <li>People who enjoy expressing their personality through fashion</li>
            </ul>

            <p>
              No gift is guaranteed to suit absolutely everyone, but
              when someone already loves zodiac signs, astrology, or
              spiritual symbolism, a shirt representing their sign
              is a thoughtful place to start.
            </p>

            <h2 className="text-2xl md:text-3xl text-white font-[family-name:var(--font-exo2)] font-bold pt-6">
              6. Your Zodiac Shirt Can Travel Around the World
            </h2>

            <p>
              Astrology isn't limited to one city, country, or culture.
              People around the world connect with zodiac signs and
              use astrology as a way to explore personality,
              relationships, and self-expression.
            </p>

            <p>
              Zodiac Datn Shop is built around that shared interest.
              Our online storefront makes it possible for customers
              to discover and order zodiac-inspired designs from
              around the world, with international shipping
              availability depending on the destination and
              checkout options.
            </p>

            <p>
              Whether you're shopping for yourself, surprising a
              partner, or sending a birthday gift overseas, your
              zodiac style can travel beyond your hometown.
            </p>

            <h2 className="text-2xl md:text-3xl text-white font-[family-name:var(--font-exo2)] font-bold pt-6">
              7. More Than a Shirt. It's Your Sign.
            </h2>

            <p>
              Zodiac Datn Shop is about bringing people together
              through something they already enjoy: astrology,
              personality, fashion, and connection.
            </p>

            <p>
              For singles, it's a wearable conversation starter.
              For couples, it's a way to celebrate two different
              personalities. For friends, it's a thoughtful gift.
              And for astrology fans, it's another way to show
              the world what makes their sign special.
            </p>

            <p>
              Twelve signs. Countless personalities. Infinite
              ways to express yourself.
            </p>
          </div>

          <div className="mt-14 p-8 md:p-12 rounded-2xl bg-gradient-to-br from-purple-950 via-gray-950 to-pink-950 text-center border border-gray-800">
            <p className="text-xs uppercase tracking-[0.3em] text-pink-300 mb-5">
              The Zodiac Datn Shop Launch
            </p>

            <h2 className="text-3xl md:text-5xl font-[family-name:var(--font-exo2)] font-bold leading-tight">
              WHAT'S YOUR SIGN?
            </h2>

            <p className="text-gray-300 text-sm md:text-base max-w-lg mx-auto mt-5 leading-relaxed">
              Find your zodiac. Represent your energy. Match with
              your person. Give a gift that actually means something.
            </p>

            <Link
              href="/shop"
              className="inline-flex mt-8 px-8 py-4 bg-white text-black text-xs font-bold tracking-widest uppercase rounded-full hover:bg-pink-200 transition-colors"
            >
              Shop Zodiac Datn
            </Link>

            <p className="text-gray-500 text-xs mt-5">
              Your sign. Your style. Your story.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

async function BlogPosts() {
  const posts: BlogPost[] = await client.fetch(
    allPostsQuery,
    {},
    { next: { revalidate: 60 } }
  );

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 border-t border-gray-900">
        <p className="text-gray-500 text-sm tracking-widest uppercase">
          More stories coming soon
        </p>
        <p className="text-gray-700 text-xs mt-2">
          Stay tuned for the latest from Zodiac Datn Shop.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post) => (
        <Link
          key={post._id}
          href={`/blog/${post.slug.current}`}
          className="group flex flex-col gap-4"
        >
          {post.coverImage?.asset ? (
            <div className="relative w-full aspect-[3/2] overflow-hidden bg-gray-900 rounded-xl">
              <Image
                src={urlFor(post.coverImage).width(720).height(480).url()}
                alt={post.coverImage.alt || post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="w-full aspect-[3/2] bg-gray-950 rounded-xl flex items-center justify-center">
              <span className="text-gray-600 text-3xl font-[family-name:var(--font-exo2)]">
                Zodiac Datn
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs tracking-widest uppercase text-gray-500">
            {post.categories?.[0] && (
              <>
                <span className="text-pink-400">{post.categories[0]}</span>
                <span>·</span>
              </>
            )}
            <span>{formatDate(post.publishedAt)}</span>
          </div>

          <h2 className="text-lg font-semibold text-white leading-snug tracking-tight group-hover:text-pink-300 transition-colors">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>
          )}

          <span className="text-xs tracking-widest uppercase text-white border-b border-white pb-1 w-fit group-hover:text-pink-300 group-hover:border-pink-300 transition-colors">
            Read Article →
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="max-w-6xl mx-auto px-6 pt-20 pb-16 border-b border-gray-800">
        <p className="text-xs tracking-[0.3em] uppercase text-pink-400 mb-5">
          Zodiac Datn Shop Journal
        </p>

        <h1 className="text-5xl md:text-8xl font-[family-name:var(--font-exo2)] tracking-tight font-bold">
          THE ZODIAC DROP.
        </h1>

        <p className="text-gray-400 mt-6 text-sm md:text-base max-w-xl leading-relaxed">
          Astrology meets fashion. Discover the 3D emoji zodiac
          compatibility shirts, relationship connections, matching
          looks, gift ideas, and the culture behind your sign.
        </p>

        <div className="flex flex-wrap gap-3 mt-8">
          <span className="text-xs text-gray-400 border border-gray-800 rounded-full px-4 py-2">
            12 Zodiac Signs
          </span>
          <span className="text-xs text-gray-400 border border-gray-800 rounded-full px-4 py-2">
            Singles & Couples
          </span>
          <span className="text-xs text-gray-400 border border-gray-800 rounded-full px-4 py-2">
            Astrology & Style
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <LaunchArticle />

        <section>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-pink-400 mb-3">
                Explore the Culture
              </p>
              <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-exo2)] font-bold">
                The Latest Stories
              </h2>
            </div>

            <p className="text-gray-500 text-sm max-w-sm">
              More zodiac inspiration, fashion stories, and
              compatibility conversations coming your way.
            </p>
          </div>

          <Suspense fallback={<BlogSkeleton />}>
            <BlogPosts />
          </Suspense>
        </section>
      </main>

      <Footer />
    </div>
  );
}
