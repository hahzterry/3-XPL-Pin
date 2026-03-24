'use client';

import { useState } from 'react';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

export default function CollectionDescription() {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mb-6">
      {/* Expandable Toggle Button */}
      <button
        onClick={toggleExpanded}
        className="flex items-center gap-2 text-forest-400 hover:text-forest-300 transition-colors duration-200 mb-3"
      >
        {isExpanded ? (
          <MinusIcon className="w-4 h-4" />
        ) : (
          <PlusIcon className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isExpanded ? 'Show less' : 'Learn more about the technology'}
        </span>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
          <p className="text-base text-gray-400 leading-relaxed">
            Every Gen-Plasma NFT is generated in real-time using your unique token ID as a seed, 
            ensuring no two pieces are ever identical. The algorithms simulate plasma behavior 
            including <span className="text-forest-400">electromagnetic fields</span>, 
            <span className="text-forest-400"> particle collisions</span>, and 
            <span className="text-forest-400"> energy cascades</span>.
          </p>
          <p className="text-base text-gray-400 leading-relaxed">
            Our advanced mathematical models create <span className="text-forest-400">3D volumetric spirals</span> with 
            spatial depth, <span className="text-forest-400">fluid energy fields</span> that flow organically, 
            and <span className="text-forest-400">turbulent dynamics</span> that mirror real plasma physics phenomena.
          </p>
        </div>
      )}
    </div>
  );
}
