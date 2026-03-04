"use client";

import { motion } from "framer-motion";

interface ComingSoonPageProps {
  title: string;
}

export default function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <div className="relative flex-1 flex items-center justify-center px-6 py-20 text-white">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl"
      >
        {/* Badge */}
        <div className="inline-block px-4 py-2 mb-6 text-sm tracking-wider text-[#00C896] border border-[#00C896]/30 rounded-full backdrop-blur-md bg-[#00C896]/10">
          🚧 UNDER DEVELOPMENT
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-linear-to-r from-[#00C896] to-[#7B61FF] bg-clip-text text-transparent">
          {title} Coming Soon
        </h1>

        {/* Description */}
        <p className="text-gray-400 text-lg mb-10">
          We're building powerful features for SynapseCare AI. Stay tuned —
          exciting updates are on the way.
        </p>

        {/* Animated Glow Line */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "120px" }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="h-0.5 mx-auto mb-10 bg-linear-to-r from-[#00C896] to-[#7B61FF]"
        />

        {/* Button */}
        <button
          onClick={() => window.history.back()}
          className="px-8 py-3 rounded-2xl bg-linear-to-r from-[#00C896] to-[#00A3FF] hover:opacity-90 transition-all duration-300 shadow-lg shadow-[#00C896]/20"
        >
          Go Back
        </button>
      </motion.div>
    </div>
  );
}
