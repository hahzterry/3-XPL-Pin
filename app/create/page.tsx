'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnimatedBackground from '@/components/AnimatedBackground';

// Admin addresses (you can add more)
const ADMIN_ADDRESSES = [
  '0x36d7885524c591eda18Cf678b49a09772E89dB5c', // Your admin address
].map(addr => addr.toLowerCase());

export default function CreatePage() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<'deploy' | 'submit' | 'admin'>('deploy');
  const isAdmin = address && ADMIN_ADDRESSES.includes(address.toLowerCase());
  
  // Submission form state
  const [contractAddress, setContractAddress] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [xProfile, setXProfile] = useState('');
  const [discord, setDiscord] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  
  // Admin panel state
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  
  // Deployed collections state
  const [deployedCollections, setDeployedCollections] = useState<any[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [approvingAddress, setApprovingAddress] = useState<string | null>(null);
  const [adminView, setAdminView] = useState<'submissions' | 'deployed'>('submissions');
  
  // Load submissions for admin
  useEffect(() => {
    if (isAdmin && activeTab === 'admin') {
      if (adminView === 'submissions') {
        loadSubmissions();
      } else {
        loadDeployedCollections();
      }
    }
  }, [isAdmin, activeTab, adminView]);
  
  const loadSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const response = await fetch('/api/submissions/get-submissions?status=pending');
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };
  
  const loadDeployedCollections = async () => {
    setIsLoadingCollections(true);
    try {
      const response = await fetch('/api/submissions/get-unapproved-collections');
      const data = await response.json();
      if (data.success) {
        setDeployedCollections(data.collections);
      }
    } catch (error) {
      console.error('Error loading deployed collections:', error);
    } finally {
      setIsLoadingCollections(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      setSubmitMessage('❌ Please connect your wallet first');
      return;
    }
    
    if (!contractAddress || !collectionName || !creatorName || !description) {
      setSubmitMessage('❌ Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitMessage('Submitting your collection...');
    
    try {
      const response = await fetch('/api/submissions/submit-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress,
          collectionName,
          creatorName,
          websiteUrl,
          description,
          submitterAddress: address,
          xProfile,
          discord
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubmitMessage('✅ ' + data.message);
        // Reset form
        setContractAddress('');
        setCollectionName('');
        setCreatorName('');
        setWebsiteUrl('');
        setDescription('');
        setXProfile('');
        setDiscord('');
      } else {
        setSubmitMessage('❌ ' + (data.error || 'Submission failed'));
      }
    } catch (error) {
      console.error('Error submitting:', error);
      setSubmitMessage('❌ Failed to submit collection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReview = async (submissionId: string, action: 'approve' | 'deny', contractType: string = 'basic') => {
    if (!address) return;
    
    setReviewingId(submissionId);
    
    try {
      const response = await fetch('/api/submissions/review-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          action,
          reviewerAddress: address,
          contractType,
          isFeatured: false
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        // Reload submissions
        loadSubmissions();
      } else {
        alert('Error: ' + (data.error || 'Review failed'));
      }
    } catch (error) {
      console.error('Error reviewing submission:', error);
      alert('Failed to review submission');
    } finally {
      setReviewingId(null);
    }
  };
  
  const handleApproveCollection = async (contractAddress: string) => {
    if (!address) return;
    
    if (!confirm('Approve and feature this collection? It will be highlighted on the explore page!')) {
      return;
    }
    
    setApprovingAddress(contractAddress);
    
    try {
      const response = await fetch('/api/submissions/approve-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress,
          adminAddress: address
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Collection approved and featured!');
        // Reload deployed collections
        loadDeployedCollections();
      } else {
        alert('Error: ' + (data.error || 'Approval failed'));
      }
    } catch (error) {
      console.error('Error approving collection:', error);
      alert('Failed to approve collection');
    } finally {
      setApprovingAddress(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <Header />
        
        <main className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 plasma-gradient-text">
              Create & Deploy
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Launch your own NFT collection on Plasma network or submit your existing collection for verification
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="glass-card p-2 inline-flex rounded-xl">
              <button
                onClick={() => setActiveTab('deploy')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'deploy'
                    ? 'bg-forest-500/30 text-forest-300 shadow-lg'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Deploy Collection
              </button>
              <button
                onClick={() => setActiveTab('submit')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'submit'
                    ? 'bg-forest-500/30 text-forest-300 shadow-lg'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Submit for Verification
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'admin'
                      ? 'bg-forest-500/30 text-forest-300 shadow-lg'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Admin Panel
                  {submissions.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {submissions.length}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Deploy Collection Tab */}
          {activeTab === 'deploy' && (
            <div className="max-w-4xl mx-auto">
              <div className="glass-card p-8 mb-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4 text-white">Deploy Your NFT Collection</h2>
                  <p className="text-gray-400">Launch your own customizable NFT collection on the Plasma network</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Features */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-forest-300 mb-4">Collection Features</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-forest-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-forest-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-white">ERC-721 Standard</h4>
                          <p className="text-sm text-gray-400">Fully compatible with all major marketplaces</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-forest-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-forest-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-white">Custom Metadata</h4>
                          <p className="text-sm text-gray-400">Rich attributes and properties support</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-forest-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-forest-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-white">Low Gas Fees</h4>
                          <p className="text-sm text-gray-400">Deploy and mint on Plasma network</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-forest-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-forest-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-white">Multiple Contract Types</h4>
                          <p className="text-sm text-gray-400">Basic, Editions, and Pro collections</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-forest-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-forest-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-white">Royalty Support</h4>
                          <p className="text-sm text-gray-400">Built-in creator royalties (EIP-2981)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Launch Button & Special Offer */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-forest-300 mb-4">Get Started</h3>
                    
                    {/* Launch Button */}
                    <div className="text-center">
                      <a href="/create/builder">
                        <button className="w-full px-6 py-4 bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                          Launch Collection Builder
                        </button>
                      </a>
                      <p className="text-xs text-gray-500 mt-2">
                        Professional no-code deployment tool
                      </p>
                    </div>
                    
                    {/* Holder Discount */}
                    <div className="glass-card p-4 border border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white">Holder Exclusive</h4>
                        <div className="text-right">
                          <span className="text-yellow-300 font-bold text-lg">50% OFF</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        Gen-Plasma holders get half-price on all deployments!
                      </p>
                      <div className="bg-black/30 rounded p-2 mb-2">
                        <div className="text-xs text-gray-500 mb-0.5">Contract:</div>
                        <div className="font-mono text-yellow-300 text-xs break-all">
                          0xB10d...4D08
                        </div>
                      </div>
                      <div className="text-xs text-yellow-300/80">
                        ✨ Auto-applied
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-xl font-semibold text-forest-300 mb-4">Deployment Options</h3>
                    
                    <div className="space-y-4">
                      <div className="glass-card p-4 border border-forest-500/20">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-white">Basic Collection</h4>
                          <div className="text-right">
                            <span className="text-forest-300 font-bold text-lg">18 XPL</span>
                            <div className="text-xs text-green-400">Launch Promo</div>
                          </div>
                        </div>
                        <ul className="text-sm text-gray-400 space-y-1">
                          <li>• Standard ERC-721 contract</li>
                          <li>• Up to 1,000 tokens</li>
                          <li>• Custom mint page</li>
                          <li>• Community support</li>
                        </ul>
                      </div>

                      <div className="glass-card p-4 border border-purple-500/30">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-white">Editions Collection</h4>
                          <div className="text-right">
                            <span className="text-purple-300 font-bold text-lg">22 XPL</span>
                            <div className="text-xs text-green-400">Launch Promo</div>
                          </div>
                        </div>
                        <ul className="text-sm text-gray-400 space-y-1">
                          <li>• Single artwork, multiple copies</li>
                          <li>• Up to 1,000 editions</li>
                          <li>• Merkle tree whitelist support</li>
                          <li>• Time-based scheduling</li>
                          <li>• Perfect for digital art</li>
                        </ul>
                        <div className="mt-3">
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                            Popular
                          </span>
                        </div>
                      </div>

                      <div className="glass-card p-4 border border-forest-400/40">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-white">Pro Collection</h4>
                          <div className="text-right">
                            <span className="text-forest-300 font-bold text-lg">35 XPL</span>
                            <div className="text-xs text-green-400">Launch Promo</div>
                          </div>
                        </div>
                        <ul className="text-sm text-gray-400 space-y-1">
                          <li>• Advanced contract features</li>
                          <li>• Up to 10,000 tokens</li>
                          <li>• Merkle tree whitelist support</li>
                          <li>• Royalty management (EIP-2981)</li>
                          <li>• Time-based scheduling</li>
                          <li>• Custom mint page</li>
                          <li>• Priority verification</li>
                        </ul>
                        <div className="mt-3">
                          <span className="text-xs bg-forest-500/20 text-forest-300 px-2 py-1 rounded-full">
                            Recommended
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit for Verification Tab */}
          {activeTab === 'submit' && (
            <div className="max-w-4xl mx-auto">
              <div className="glass-card p-8 mb-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4 text-white">Submit Collection for Verification</h2>
                  <p className="text-gray-400">Get your existing NFT collection verified and featured in our ecosystem</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Requirements */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-forest-300 mb-4">Verification Requirements</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-forest-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-forest-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-white">Contract Verification</h4>
                          <p className="text-sm text-gray-400">Source code verified on Plasmascan</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-forest-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-forest-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-white">Creator Identity</h4>
                          <p className="text-sm text-gray-400">Verified social media or website</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-forest-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-forest-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-white">Quality Standards</h4>
                          <p className="text-sm text-gray-400">Original artwork and proper metadata</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-forest-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-forest-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-white">Community Value</h4>
                          <p className="text-sm text-gray-400">Active community or artistic merit</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-forest-300 mb-4">Verification Benefits</h3>
                    
                    <div className="space-y-4">
                      <div className="glass-card p-4 border border-forest-500/20">
                        <h4 className="font-semibold text-white mb-2">🔹 Verified Badge</h4>
                        <p className="text-sm text-gray-400">Green checkmark displayed across the platform</p>
                      </div>

                      <div className="glass-card p-4 border border-forest-500/20">
                        <h4 className="font-semibold text-white mb-2">🔹 Featured Listings</h4>
                        <p className="text-sm text-gray-400">Priority placement in collection browser</p>
                      </div>

                      <div className="glass-card p-4 border border-forest-500/20">
                        <h4 className="font-semibold text-white mb-2">🔹 Wallet Integration</h4>
                        <p className="text-sm text-gray-400">Automatic detection in user wallets</p>
                      </div>

                      <div className="glass-card p-4 border border-forest-500/20">
                        <h4 className="font-semibold text-white mb-2">🔹 Analytics Dashboard</h4>
                        <p className="text-sm text-gray-400">Detailed collection metrics and insights</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submission Form */}
                <form onSubmit={handleSubmit} className="border-t border-white/10 pt-8">
                  <h3 className="text-xl font-semibold text-white mb-6">Submit Your Collection</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Contract Address *
                      </label>
                      <input
                        type="text"
                        placeholder="0x..."
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Collection Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Your Collection Name"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Creator/Artist Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Your name or artist name"
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        X Profile
                      </label>
                      <input
                        type="text"
                        placeholder="@username"
                        value={xProfile}
                        onChange={(e) => setXProfile(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Discord
                      </label>
                      <input
                        type="text"
                        placeholder="discord.gg/..."
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Collection Description *
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe your collection, its story, and what makes it unique..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors resize-none"
                      required
                    />
                  </div>

                  {submitMessage && (
                    <div className={`mt-6 p-4 rounded-lg ${
                      submitMessage.includes('✅') 
                        ? 'bg-green-500/20 border border-green-500/50' 
                        : 'bg-red-500/20 border border-red-500/50'
                    }`}>
                      <p className="text-center text-white">{submitMessage}</p>
                    </div>
                  )}

                  <div className="mt-8 text-center">
                    <button 
                      type="submit"
                      disabled={isSubmitting || !address}
                      className="px-8 py-4 bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                    </button>
                    {!address && (
                      <p className="text-sm text-yellow-500 mt-3">
                        Please connect your wallet to submit
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-3">
                      Review process typically takes 2-5 business days
                    </p>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Admin Panel Tab */}
          {activeTab === 'admin' && isAdmin && (
            <div className="max-w-6xl mx-auto">
              <div className="glass-card p-8 mb-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4 text-white">Admin Panel</h2>
                  <p className="text-gray-400">Manage collection submissions and approvals</p>
                </div>
                
                {/* View Toggle */}
                <div className="flex justify-center mb-8">
                  <div className="glass-card p-1 inline-flex rounded-lg">
                    <button
                      onClick={() => setAdminView('submissions')}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                        adminView === 'submissions'
                          ? 'bg-forest-500/30 text-forest-300'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Pending Submissions
                      {submissions.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {submissions.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setAdminView('deployed')}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                        adminView === 'deployed'
                          ? 'bg-forest-500/30 text-forest-300'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Deployed Collections
                      {deployedCollections.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                          {deployedCollections.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Pending Submissions View */}
                {adminView === 'submissions' && (
                  <>
                    {isLoadingSubmissions ? (
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-forest-500"></div>
                        <p className="text-gray-400 mt-4">Loading submissions...</p>
                      </div>
                    ) : submissions.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">No pending submissions</p>
                      </div>
                    ) : (
                  <div className="space-y-6">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="glass-card p-6 border border-white/10">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Submission Details */}
                          <div className="space-y-3">
                            <div>
                              <h3 className="text-xl font-bold text-white">{submission.collection_name}</h3>
                              <p className="text-sm text-gray-400">by {submission.creator_name}</p>
                            </div>
                            
                            <div>
                              <label className="text-xs text-gray-500 uppercase">Contract Address</label>
                              <a 
                                href={`https://plasmascan.to/address/${submission.contract_address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-forest-300 hover:text-forest-200 font-mono text-sm break-all"
                              >
                                {submission.contract_address}
                              </a>
                            </div>
                            
                            <div>
                              <label className="text-xs text-gray-500 uppercase">Submitter</label>
                              <p className="text-white font-mono text-sm">{submission.submitter_address}</p>
                            </div>
                            
                            <div>
                              <label className="text-xs text-gray-500 uppercase">Submitted</label>
                              <p className="text-white text-sm">
                                {new Date(submission.submitted_at).toLocaleString()}
                              </p>
                            </div>
                            
                            {/* Contract Details */}
                            <div className="border-t border-white/10 pt-3 space-y-2">
                              <h4 className="text-xs text-gray-400 uppercase font-semibold">Contract Details</h4>
                              
                              {submission.symbol && (
                                <div>
                                  <label className="text-xs text-gray-500">Symbol</label>
                                  <p className="text-white text-sm">{submission.symbol}</p>
                                </div>
                              )}
                              
                              {submission.total_supply && (
                                <div>
                                  <label className="text-xs text-gray-500">Max Supply</label>
                                  <p className="text-white text-sm">{submission.total_supply.toLocaleString()}</p>
                                </div>
                              )}
                              
                              {submission.mint_price && (
                                <div>
                                  <label className="text-xs text-gray-500">Mint Price</label>
                                  <p className="text-white text-sm">{submission.mint_price} XPL</p>
                                </div>
                              )}
                            </div>
                            
                            {submission.website_url && (
                              <div>
                                <label className="text-xs text-gray-500 uppercase">Website</label>
                                <a 
                                  href={submission.website_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-forest-300 hover:text-forest-200 text-sm"
                                >
                                  {submission.website_url}
                                </a>
                              </div>
                            )}
                            
                            {submission.x_profile && (
                              <div>
                                <label className="text-xs text-gray-500 uppercase">X Profile</label>
                                <p className="text-white text-sm">{submission.x_profile}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Description & Actions */}
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs text-gray-500 uppercase">Description</label>
                              <p className="text-white text-sm mt-1 whitespace-pre-wrap">{submission.description}</p>
                            </div>
                            
                            {/* Contract Type Selection */}
                            <div>
                              <label className="text-xs text-gray-500 uppercase mb-2 block">Contract Type</label>
                              <select 
                                id={`type-${submission.id}`}
                                className="w-full p-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm [color-scheme:dark]"
                                defaultValue="basic"
                              >
                                <option value="basic">Basic</option>
                                <option value="editions">Editions</option>
                                <option value="pro">Pro</option>
                              </select>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                              <button
                                onClick={() => {
                                  const select = document.getElementById(`type-${submission.id}`) as HTMLSelectElement;
                                  handleReview(submission.id, 'approve', select.value);
                                }}
                                disabled={reviewingId === submission.id}
                                className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {reviewingId === submission.id ? 'Processing...' : '✅ Approve & Create Mint Page'}
                              </button>
                              
                              <button
                                onClick={() => handleReview(submission.id, 'deny')}
                                disabled={reviewingId === submission.id}
                                className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                ❌ Deny
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                    )}
                  </>
                )}
                
                {/* Deployed Collections View */}
                {adminView === 'deployed' && (
                  <>
                    {isLoadingCollections ? (
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-forest-500"></div>
                        <p className="text-gray-400 mt-4">Loading deployed collections...</p>
                      </div>
                    ) : deployedCollections.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">All deployed collections are already approved! 🎉</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {deployedCollections.map((collection) => (
                          <div key={collection.contract_address} className="glass-card p-6 border border-white/10">
                            <div className="grid md:grid-cols-3 gap-6">
                              {/* Collection Info */}
                              <div className="md:col-span-2 space-y-3">
                                <div>
                                  <h3 className="text-xl font-bold text-white">{collection.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                      collection.contract_type === 'pro' ? 'bg-purple-500/20 text-purple-300' :
                                      collection.contract_type === 'editions' ? 'bg-blue-500/20 text-blue-300' :
                                      'bg-green-500/20 text-green-300'
                                    }`}>
                                      {collection.contract_type.toUpperCase()}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-green-500/20 text-green-300">
                                      DEPLOYED
                                    </span>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-xs text-gray-500 uppercase">Contract Address</label>
                                  <a 
                                    href={`https://plasmascan.to/address/${collection.contract_address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-forest-300 hover:text-forest-200 font-mono text-sm break-all"
                                  >
                                    {collection.contract_address}
                                  </a>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs text-gray-500 uppercase">Symbol</label>
                                    <p className="text-white text-sm">{collection.symbol}</p>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 uppercase">Max Supply</label>
                                    <p className="text-white text-sm">{collection.max_supply?.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 uppercase">Mint Price</label>
                                    <p className="text-white text-sm">{collection.mint_price} XPL</p>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 uppercase">Deployed</label>
                                    <p className="text-white text-sm">
                                      {new Date(collection.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-xs text-gray-500 uppercase">Contract Address (Short)</label>
                                  <p className="text-white font-mono text-xs">
                                    {collection.contract_address.slice(0, 6)}...{collection.contract_address.slice(-4)}
                                  </p>
                                </div>
                                
                                <div>
                                  <label className="text-xs text-gray-500 uppercase">Deployer</label>
                                  <p className="text-white font-mono text-xs">{collection.deployer_address}</p>
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex flex-col justify-between">
                                <div className="space-y-3">
                                  <a
                                    href={`/mint/${collection.contract_address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-center font-medium rounded-lg transition-colors"
                                  >
                                    View Mint Page →
                                  </a>
                                  
                                  <a
                                    href={`https://plasmascan.to/address/${collection.contract_address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-center font-medium rounded-lg transition-colors"
                                  >
                                    View on Explorer →
                                  </a>
                                </div>
                                
                                <button
                                  onClick={() => handleApproveCollection(collection.contract_address)}
                                  disabled={approvingAddress === collection.contract_address}
                                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                >
                                  {approvingAddress === collection.contract_address ? 'Approving...' : '✨ Approve & Feature'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Additional Resources */}
          <div className="max-w-4xl mx-auto mt-16">
            <h2 className="text-2xl font-bold text-white text-center mb-8">Developer Resources</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-card p-6 text-center">
                <div className="w-12 h-12 bg-forest-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-forest-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Documentation</h3>
                <p className="text-gray-400 text-sm mb-4">Complete guides for deploying NFT contracts</p>
                <a href="https://docs.plasma.to" target="_blank" rel="noopener noreferrer" className="text-forest-300 hover:text-forest-200 text-sm font-medium">
                  View Docs →
                </a>
              </div>

              <div className="glass-card p-6 text-center">
                <div className="w-12 h-12 bg-forest-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-forest-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Smart Contracts</h3>
                <p className="text-gray-400 text-sm mb-4">Open-source contract templates and examples</p>
                <a href="https://github.com/plasma-network" target="_blank" rel="noopener noreferrer" className="text-forest-300 hover:text-forest-200 text-sm font-medium">
                  GitHub →
                </a>
              </div>

              <div className="glass-card p-6 text-center">
                <div className="w-12 h-12 bg-forest-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-forest-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Community</h3>
                <p className="text-gray-400 text-sm mb-4">Get help from other creators and developers</p>
                <p className="text-gray-500 text-sm font-medium">
                  Coming Soon
                </p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
