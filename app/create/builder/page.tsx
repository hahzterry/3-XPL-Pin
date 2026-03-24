'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DeploymentSuccessModal from '@/components/DeploymentSuccessModal';
import PaymentModal from '@/components/PaymentModal';

type BuilderStep = 'contract' | 'metadata' | 'upload' | 'royalty' | 'deployment';

// Drag and Drop Upload Area Component
interface DragDropUploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  onSingleAdd: () => void;
  maxFiles: number;
  contractType: string;
}

const DragDropUploadArea: React.FC<DragDropUploadAreaProps> = ({ 
  onFilesSelected, 
  onSingleAdd, 
  maxFiles, 
  contractType 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: 0 });

    const files = Array.from(e.dataTransfer.files);
    setProcessingProgress({ current: 0, total: files.length });
    await onFilesSelected(files);
    setIsProcessing(false);
    setProcessingProgress({ current: 0, total: 0 });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setIsProcessing(true);
      const files = Array.from(e.target.files);
      setProcessingProgress({ current: 0, total: files.length });
      await onFilesSelected(files);
      setIsProcessing(false);
      setProcessingProgress({ current: 0, total: 0 });
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="text-center py-12 glass-card">
      <div
        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragOver 
            ? 'border-forest-500 bg-forest-500/10' 
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-forest-500 border-t-transparent rounded-full mx-auto"></div>
            <div className="text-center">
              <p className="text-forest-300 font-medium">Processing images...</p>
              {processingProgress.total > 0 && (
                <div className="mt-2">
                  <p className="text-forest-200 text-sm">
                    Optimizing {processingProgress.total} images to WebP format
                  </p>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-forest-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-forest-300 text-xs mt-1">
                    {processingProgress.current} of {processingProgress.total} images processed
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h4 className="text-lg font-semibold text-gray-300 mb-2">No NFTs Added Yet</h4>
            <p className="text-gray-500 mb-6">
              {contractType === 'pro' 
                ? `Drag & drop up to ${maxFiles} images or click to select files`
                : `Drag & drop up to ${maxFiles} images or click to select files`
              }
            </p>
            
            <div className="space-y-3">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="batch-upload"
              />
              <label
                htmlFor="batch-upload"
                className="inline-block px-6 py-3 bg-forest-500 hover:bg-forest-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                Select Multiple Images
              </label>
              
              <div className="text-gray-400 text-sm">
                or
              </div>
              
              <button
                onClick={onSingleAdd}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Add One by One
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <p>• Images will be automatically optimized to WebP format (max 4K resolution)</p>
              <p>• Supported input formats: JPG, PNG, GIF, WebP</p>
              <p>• Output: WebP format for best quality and smaller file sizes</p>
              <p>• Maximum {maxFiles} files for {contractType} contracts</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Helper function to get available steps based on contract type
const getAvailableSteps = (contractType: string): BuilderStep[] => {
  const baseSteps: BuilderStep[] = ['contract', 'metadata', 'upload', 'deployment'];
  
  // Only Pro contracts support royalties for now
  if (contractType === 'pro') {
    return ['contract', 'metadata', 'upload', 'royalty', 'deployment'];
  }
  
  return baseSteps;
};

interface ContractConfig {
  type: 'basic' | 'pro' | 'editions';
  name: string;
  symbol: string;
  maxSupply: number;
  mintPrice: number;
  maxPerWallet: number;
}

interface MetadataConfig {
  collectionName: string;
  description: string;
  image: string;
  externalUrl: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  // Editions-specific artwork metadata
  artworkName: string;
  artworkDescription: string;
  artistName: string;
}

interface RoyaltyConfig {
  enabled: boolean;
  recipient: string;
  percentage: number;
}

interface NFTItem {
  id: string;
  name: string;
  description: string;
  image: File | null;
  imagePreview: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface UploadConfig {
  uploadMethod: 'individual' | 'batch';
  storageType: 'ipfs' | 'onchain';
  nftItems: NFTItem[];
  editionsArtwork?: {
    file: File;
    preview: string;
  };
}

interface DeploymentConfig {
  network: 'plasma' | 'plasma-testnet';
  autoVerify: boolean;
  createMintSite: boolean;
}

export default function CollectionBuilderPage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [currentStep, setCurrentStep] = useState<BuilderStep>('contract');
  const [isGenPlasmaHolder, setIsGenPlasmaHolder] = useState(false);
  const [isCheckingHolder, setIsCheckingHolder] = useState(false);

  // Check Gen-Plasma holder status when address changes
  useEffect(() => {
    if (address) {
      checkGenPlasmaHolder();
    } else {
      setIsGenPlasmaHolder(false);
    }
  }, [address]);

  const [contractConfig, setContractConfig] = useState<ContractConfig>({
    type: 'basic',
    name: '',
    symbol: '',
    maxSupply: 1000,
    mintPrice: 0.01,
    maxPerWallet: 10
  });
  const [metadataConfig, setMetadataConfig] = useState<MetadataConfig>({
    collectionName: '',
    description: '',
    image: '',
    externalUrl: '',
    attributes: [],
    // Editions-specific artwork metadata
    artworkName: '',
    artworkDescription: '',
    artistName: ''
  });
  const [royaltyConfig, setRoyaltyConfig] = useState<RoyaltyConfig>({
    enabled: false,
    recipient: '',
    percentage: 5
  });
  const [uploadConfig, setUploadConfig] = useState<UploadConfig>({
    uploadMethod: 'individual',
    storageType: 'ipfs',
    nftItems: []
  });
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>({
    network: 'plasma',
    autoVerify: true,
    createMintSite: true
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTransactionHash, setPaymentTransactionHash] = useState<string>('');
  
  // Treasury address for payments
  const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0x36d7885524c591eda18Cf678b49a09772E89dB5c';

  // Auto-update max supply for Pro contracts based on NFT items
  useEffect(() => {
    if (contractConfig.type === 'pro' || contractConfig.type === 'basic') {
      const nftItemsCount = uploadConfig.nftItems.length;
      if (nftItemsCount > 0) {
        setContractConfig(prev => ({
          ...prev,
          maxSupply: nftItemsCount
        }));
      }
    }
  }, [uploadConfig.nftItems.length, contractConfig.type]);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      uploadConfig.nftItems.forEach(item => {
        if (item.imagePreview && item.imagePreview.startsWith('blob:')) {
          URL.revokeObjectURL(item.imagePreview);
        }
      });
    };
  }, []);

  // Image optimization function with WebP format
  const optimizeImage = (file: File, maxWidth: number = 4096, quality: number = 0.85): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Try WebP first, fallback to JPEG if not supported
        const tryWebP = () => {
          canvas.toBlob((blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(optimizedFile);
            } else {
              // WebP not supported, try JPEG
              canvas.toBlob((jpegBlob) => {
                if (jpegBlob) {
                  const optimizedFile = new File([jpegBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  resolve(optimizedFile);
                } else {
                  resolve(file); // Fallback to original file
                }
              }, 'image/jpeg', quality);
            }
          }, 'image/webp', quality);
        };
        
        tryWebP();
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle batch file upload
  const handleBatchFileUpload = async (files: File[] | React.ChangeEvent<HTMLInputElement>) => {
    let fileArray: File[];
    
    // Handle both direct file array and input event
    if (Array.isArray(files)) {
      fileArray = files;
    } else {
      fileArray = Array.from(files.target.files || []);
      // Reset input
      files.target.value = '';
    }
    const maxFiles = contractConfig.type === 'pro' || contractConfig.type === 'basic' ? 100 : 50;
    
    if (fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed for ${contractConfig.type} contracts`);
      return;
    }

    // Filter only image files
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Please select only image files');
      return;
    }

    if (imageFiles.length !== fileArray.length) {
      alert(`Only ${imageFiles.length} out of ${fileArray.length} files are images. Non-image files were ignored.`);
    }

    // Process files with optimization and upload to temporary storage
    const newItems: NFTItem[] = [];
    const tempUploadIds = [];
    
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      try {
        // Update progress (this will be handled by the DragDropUploadArea component)
        console.log(`Processing image ${i + 1} of ${imageFiles.length}: ${file.name}`);
        
        // Optimize image
        const optimizedFile = await optimizeImage(file);
        
        // Create object URL for preview instead of base64 to avoid URL length issues
        const previewUrl = URL.createObjectURL(optimizedFile);
        
        // Upload to temporary storage for IPFS processing
        const formData = new FormData();
        formData.append('file', optimizedFile);
        formData.append('contractAddress', 'pending');
        formData.append('metadata', JSON.stringify({
          name: file.name.replace(/\.[^/.]+$/, ""),
          description: '',
          attributes: []
        }));

        const uploadResponse = await fetch('/api/storage/upload-temp-formdata', {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Temporary upload failed');
        }

        const uploadResult = await uploadResponse.json();
        if (uploadResult.tempUploadId) {
          tempUploadIds.push(uploadResult.tempUploadId);
          console.log(`✅ Uploaded ${file.name} to temporary storage, ID: ${uploadResult.tempUploadId}`);
        } else {
          console.log(`⚠️ Uploaded ${file.name} but no tempUploadId returned`);
        }
        
        const newItem: NFTItem = {
          id: Date.now().toString() + i,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          description: '',
          image: optimizedFile,
          imagePreview: previewUrl, // Use object URL instead of base64
          attributes: []
        };
        
        newItems.push(newItem);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    // Store temp upload IDs for later IPFS migration
    (global as any).tempUploadIds = tempUploadIds;
    console.log(`✅ Uploaded ${tempUploadIds.length} items to temporary storage for IPFS processing`);

    // Add all new items
    setUploadConfig(prev => ({
      ...prev,
      nftItems: [...prev.nftItems, ...newItems]
    }));
  };

  // Helper functions
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const checkGenPlasmaHolder = async () => {
    if (!address) return;
    
    setIsCheckingHolder(true);
    try {
      // Check if user holds any Gen-Plasma NFTs
      const response = await fetch(`/api/check-nft-holder?address=${address}&contract=0xB10d640B74016ed2b8E1f59CA931467D16534D08`);
      const result = await response.json();
      setIsGenPlasmaHolder(result.isHolder || false);
    } catch (error) {
      console.error('Error checking Gen-Plasma holder status:', error);
      setIsGenPlasmaHolder(false);
    } finally {
      setIsCheckingHolder(false);
    }
  };

  const getTotalCost = () => {
    let baseCost;
    switch (contractConfig.type) {
      case 'basic':
        baseCost = 18;
        break;
      case 'pro':
        baseCost = 35;
        break;
      case 'editions':
        baseCost = 22;
        break;
      default:
        baseCost = 18;
    }
    
    const onChainCost = uploadConfig.storageType === 'onchain' ? (baseCost * 0.1) : 0;
    const totalCost = baseCost + onChainCost;
    
    // Apply 50% discount for Gen-Plasma holders
    return isGenPlasmaHolder ? totalCost * 0.5 : totalCost;
  };

  const isFormValid = () => {
    // Check required fields
    if (!contractConfig.name || !contractConfig.symbol) return false;
    if (!metadataConfig.collectionName || !metadataConfig.description) return false;
    
    // For Editions contracts, check for artwork upload
    if (contractConfig.type === 'editions') {
      return uploadConfig.editionsArtwork?.file && uploadConfig.editionsArtwork?.preview;
    }
    
    // For Pro and Basic contracts, require at least one NFT item
    if (contractConfig.type === 'pro' || contractConfig.type === 'basic') {
      if (uploadConfig.nftItems.length === 0) return false;
      // Check if all NFTs have required data
      return uploadConfig.nftItems.every(item => 
        item.name && item.image && item.imagePreview
      );
    }
    
    // For other contract types, check NFT items
    if (uploadConfig.nftItems.length === 0) return false;
    
    // Check if all NFTs have required data
    return uploadConfig.nftItems.every(item => 
      item.name && item.image && item.imagePreview
    );
  };

  const handleDeployment = async () => {
    if (!isFormValid() || isDeploying) return;
    
    // First, show payment modal
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (transactionHash: string) => {
    setPaymentTransactionHash(transactionHash);
    setShowPaymentModal(false);
    
    // Now proceed with deployment
    setIsDeploying(true);
    setDeploymentStatus('Payment verified! Starting deployment...');
    
    try {
      // Step 1: Upload to Temporary Storage (for interface)
      setDeploymentStatus('Uploading images to temporary storage for interface');
      await uploadToTempStorage();
      
      // Step 2: Generate Contract
      setDeploymentStatus('Generating smart contract with user configuration');
      const contractResult = await generateContract();
      if (!contractResult.success) {
        throw new Error('Contract generation failed');
      }
      
      // Step 3: Upload to IPFS (permanent storage) - BEFORE deployment
      setDeploymentStatus('Uploading to IPFS for permanent storage...');
      const ipfsResult = await uploadToIPFS();
      
      // Step 4: Deploy contract with IPFS URLs
      setDeploymentStatus('Deploying to Plasma network...');
      const deploymentResult = await deployContract(ipfsResult);
      
      if (deploymentResult.success) {
        // Update the contract's base URI to use the actual contract address
        try {
          console.log('🔄 Updating contract base URI with actual contract address...');
          
          const updateBaseURIResponse = await fetch('/api/deploy/update-base-uri', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractAddress: deploymentResult.contractAddress,
              newBaseURI: `https://gen-plasma.com/api/metadata/${contractConfig.type}/${deploymentResult.contractAddress}/`
            })
          });

          if (updateBaseURIResponse.ok) {
            console.log('✅ Contract base URI updated successfully');
          } else {
            console.warn('⚠️ Failed to update contract base URI, but deployment was successful');
          }
        } catch (updateError) {
          console.warn('⚠️ Error updating contract base URI:', updateError);
          // Don't fail the deployment if base URI update fails
        }

        // Automatically add contract mapping for Pro and Basic contracts
        if (contractConfig.type === 'pro' || contractConfig.type === 'basic') {
          try {
            console.log('🔗 Adding automatic contract mapping...');
            
            // Extract URL slug from the baseTokenURI used in deployment
            const urlSlug = contractConfig.name.toLowerCase().replace(/\s+/g, '-');
            const contractAddress = deploymentResult.contractAddress;
            
            const mappingResponse = await fetch('/api/admin/add-contract-mapping', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userAddress: address,
                urlSlug: urlSlug,
                contractAddress: contractAddress,
                isAutomatic: true
              })
            });

            if (mappingResponse.ok) {
              console.log(`✅ Contract mapping added automatically: ${urlSlug} -> ${contractAddress}`);
            } else {
              console.warn('⚠️ Failed to add automatic contract mapping, but deployment was successful');
            }
          } catch (mappingError) {
            console.warn('⚠️ Error adding automatic contract mapping:', mappingError);
            // Don't fail the deployment if mapping fails
          }
        }

        // For Basic contracts, store the NFT items data in Supabase
        if (contractConfig.type === 'basic' && uploadConfig.nftItems && uploadConfig.nftItems.length > 0) {
          try {
            console.log('🎨 Storing Basic contract NFT items data...');
            console.log('🔍 IPFS Result:', ipfsResult);
            console.log('🔍 IPFS Results Array:', ipfsResult?.ipfsResults);
            
            const response = await fetch('/api/deploy/store-basic-artwork', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contractAddress: deploymentResult.contractAddress,
                nftItems: uploadConfig.nftItems.map((item, index) => {
                  const ipfsData = ipfsResult?.ipfsResults?.[index];
                  console.log(`🔍 NFT Item ${index + 1}:`, {
                    name: item.name,
                    ipfsData: ipfsData,
                    imageUrl: ipfsData?.ipfsUrl || null,
                    ipfsHash: ipfsData?.ipfsHash || null
                  });
                  
                  return {
                    name: item.name,
                    description: item.description,
                    attributes: item.attributes,
                    tokenId: index + 1,
                    // Use IPFS URLs from the upload result
                    imageUrl: ipfsData?.ipfsUrl || null,
                    ipfsHash: ipfsData?.ipfsHash || null
                  };
                })
              })
            });

            if (response.ok) {
              console.log('✅ Basic contract NFT items stored successfully');
            } else {
              console.warn('⚠️ Failed to store Basic contract NFT items, but deployment was successful');
            }
          } catch (error) {
            console.warn('⚠️ Error storing Basic contract NFT items:', error);
            // Don't fail the deployment if storage fails
          }
        }

        // For Pro contracts, store the NFT items data in Supabase
        if (contractConfig.type === 'pro' && uploadConfig.nftItems && uploadConfig.nftItems.length > 0) {
          try {
            console.log('🎨 Storing Pro contract NFT items data...');
            console.log('🔍 IPFS Result:', ipfsResult);
            console.log('🔍 IPFS Results Array:', ipfsResult?.ipfsResults);
            
            const response = await fetch('/api/deploy/store-pro-artwork', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contractAddress: deploymentResult.contractAddress,
                nftItems: uploadConfig.nftItems.map((item, index) => {
                  const ipfsData = ipfsResult?.ipfsResults?.[index];
                  console.log(`🔍 NFT Item ${index + 1}:`, {
                    name: item.name,
                    ipfsData: ipfsData,
                    imageUrl: ipfsData?.ipfsUrl || null,
                    ipfsHash: ipfsData?.ipfsHash || null
                  });
                  
                  return {
                    name: item.name,
                    description: item.description,
                    attributes: item.attributes,
                    tokenId: index + 1,
                    // Use IPFS URLs from the upload result
                    imageUrl: ipfsData?.ipfsUrl || null,
                    ipfsHash: ipfsData?.ipfsHash || null
                  };
                })
              })
            });

            if (response.ok) {
              console.log('✅ Pro contract NFT items stored successfully');
            } else {
              console.warn('⚠️ Failed to store Pro contract NFT items, but deployment was successful');
            }
          } catch (error) {
            console.warn('⚠️ Error storing Pro contract NFT items:', error);
            // Don't fail the deployment if storage fails
          }
        }

        // For Editions contracts, store the artwork data in the database
        if (contractConfig.type === 'editions') {
          try {
            const firstItem = uploadConfig.nftItems?.[0];
            const urlSlug = contractConfig.name.toLowerCase().replace(/\s+/g, '-');
            
            // Store artwork data with both URL slug and actual contract address
            const artworkDataList = [
              {
                contractAddress: urlSlug, // URL slug for metadata API lookup
                artworkName: metadataConfig.artworkName || firstItem?.name || 'Untitled Artwork',
                artworkDescription: metadataConfig.artworkDescription || firstItem?.description || 'A unique digital artwork',
                artworkImage: ipfsResult?.ipfsResults?.[0]?.ipfsUrl || '',
                artistName: metadataConfig.artistName || metadataConfig.collectionName || 'Unknown Artist',
                attributes: metadataConfig.attributes || [] // Add custom traits
              },
              {
                contractAddress: deploymentResult.contractAddress, // Actual contract address
                artworkName: metadataConfig.artworkName || firstItem?.name || 'Untitled Artwork',
                artworkDescription: metadataConfig.artworkDescription || firstItem?.description || 'A unique digital artwork',
                artworkImage: ipfsResult?.ipfsResults?.[0]?.ipfsUrl || '',
                artistName: metadataConfig.artistName || metadataConfig.collectionName || 'Unknown Artist',
                attributes: metadataConfig.attributes || [] // Add custom traits
              }
            ];

            console.log('🎨 Storing Editions artwork data for both URL slug and contract address:', artworkDataList);

            // Store both records
            for (const artworkData of artworkDataList) {
              const storeResponse = await fetch('/api/deploy/store-editions-artwork', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(artworkData)
              });

              if (storeResponse.ok) {
                console.log(`✅ Editions artwork data stored successfully for ${artworkData.contractAddress}`);
              } else {
                console.warn(`⚠️ Failed to store Editions artwork data for ${artworkData.contractAddress}`);
              }
            }
          } catch (storeError) {
            console.warn('⚠️ Error storing Editions artwork data:', storeError);
            // Don't fail the deployment if artwork storage fails
          }
        }

        setDeploymentResult({
          contractAddress: deploymentResult.contractAddress,
          transactionHash: deploymentResult.transactionHash,
          contractName: contractConfig.name,
          network: 'Plasma',
          gasUsed: '0', // We don't track gas in this flow
          deploymentCost: getTotalCost().toString(), // Actual deployment cost
          paymentTransactionHash: transactionHash, // Payment transaction
          explorerUrl: `https://plasmascan.to/address/${deploymentResult.contractAddress}`,
          contractType: contractConfig.type
        });
        setShowSuccessModal(true);
      } else {
        throw new Error('Deployment failed');
      }
      
    } catch (error: any) {
      console.error('Deployment error:', error);
      setDeploymentStatus(`Deployment failed: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };


  const processPayment = async () => {
    // For now, simulate payment processing
    // In real implementation, this would:
    // 1. Show payment modal with treasury address
    // 2. Wait for user to send XPL transaction
    // 3. Verify transaction on blockchain
    console.log(`Processing payment of ${getTotalCost()} XPL`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // TODO: Implement actual payment flow
    /*
    const paymentData = {
      userAddress: address,
      amount: getTotalCost(),
      transactionHash: userProvidedTxHash,
      deploymentId: generateDeploymentId()
    };
    
    const response = await fetch('/api/deploy/process-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    
    if (!response.ok) {
      throw new Error('Payment verification failed');
    }
    */
  };

  const uploadToTempStorage = async () => {
    console.log('Uploading images to temporary storage for interface');
    
    try {
      // For Editions contracts, upload the single artwork
      if (contractConfig.type === 'editions') {
        console.log('Uploading Editions artwork to Supabase storage');
        
        // Use FormData for large files to avoid size limits
        const formData = new FormData();
        formData.append('file', uploadConfig.editionsArtwork!.file);
        formData.append('contractAddress', 'pending');
        formData.append('metadata', JSON.stringify({
          artworkName: metadataConfig.collectionName,
          artworkDescription: metadataConfig.description,
          artistName: metadataConfig.collectionName,
          contractType: contractConfig.type
        }));
        
        const response = await fetch('/api/storage/upload-temp-formdata', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Temporary upload failed');
        }

        const result = await response.json();
        console.log('Editions temporary upload successful:', result);
        
        // Store temp upload ID for later migration (only if valid)
        (global as any).tempUploadIds = (global as any).tempUploadIds || [];
        if (result.tempUploadId) {
          (global as any).tempUploadIds.push(result.tempUploadId);
          console.log('✅ Stored tempUploadId:', result.tempUploadId);
        } else {
          console.log('⚠️ No tempUploadId returned, skipping database tracking');
        }
        
        // Update the first NFT item with the uploaded image URL
        if (uploadConfig.nftItems && uploadConfig.nftItems.length > 0) {
          uploadConfig.nftItems[0].imagePreview = result.tempUrl;
          console.log('Updated firstItem.imagePreview with tempUrl:', result.tempUrl);
        }
        
        return;
      }
      
      // For other contract types, upload individual NFT items
      const tempUploadIds = [];
      
      for (const item of uploadConfig.nftItems) {
        if (item.image) {
          // Use FormData for large files to avoid size limits
          const formData = new FormData();
          formData.append('file', item.image);
          formData.append('contractAddress', 'pending');
          formData.append('metadata', JSON.stringify({
            nftName: item.name,
            nftDescription: item.description,
            contractType: contractConfig.type
          }));
          
          const response = await fetch('/api/storage/upload-temp-formdata', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Temporary upload failed');
          }

          const result = await response.json();
          if (result.tempUploadId) {
            tempUploadIds.push(result.tempUploadId);
            console.log(`✅ Uploaded ${item.name} to temporary storage, ID: ${result.tempUploadId}`);
          } else {
            console.log(`⚠️ Uploaded ${item.name} but no tempUploadId returned`);
          }
        }
      }
      
      // Store temp upload IDs for later migration
      (global as any).tempUploadIds = tempUploadIds;
      
      console.log(`✅ Uploaded ${tempUploadIds.length} items to temporary storage`);
      
    } catch (error) {
      console.error('Temporary upload error:', error);
      throw error;
    }
  };

  const uploadToIPFS = async () => {
    console.log('Uploading to IPFS for permanent storage');
    
    try {
    const tempUploadIds = (global as any).tempUploadIds || [];
    
    if (tempUploadIds.length === 0) {
      console.log('⚠️ No temporary uploads to migrate to IPFS - database tracking failed');
      console.log('🔄 Attempting direct IPFS upload from Supabase storage...');
      
      // Fallback: Try to upload directly from Supabase storage
      // This is a simplified approach that skips the database lookup
      return {
        fallback: true,
        message: 'Using fallback IPFS upload method'
      };
    }
      
      const response = await fetch('/api/storage/upload-to-ipfs-pre-deployment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempUploadIds,
          contractType: contractConfig.type,
          contractName: contractConfig.name
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'IPFS upload failed');
      }

      const result = await response.json();
      console.log('IPFS upload successful:', result);
      
      // Clear temp upload IDs
      (global as any).tempUploadIds = [];
      
      // Return IPFS URLs for use in deployment
      return result;
      
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }
  };

  const migrateToIPFS = async (contractAddress: string) => {
    console.log('Migrating temporary uploads to IPFS for permanent storage');
    
    try {
      const tempUploadIds = (global as any).tempUploadIds || [];
      
      if (tempUploadIds.length === 0) {
        console.log('No temporary uploads to migrate');
        return;
      }
      
      const response = await fetch('/api/storage/migrate-to-ipfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress,
          contractType: contractConfig.type,
          tempUploadIds
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'IPFS migration failed');
      }

      const result = await response.json();
      console.log('IPFS migration successful:', result);
      
      // Clear temp upload IDs
      (global as any).tempUploadIds = [];
      
    } catch (error) {
      console.error('IPFS migration error:', error);
      throw error;
    }
  };

  const generateContract = async () => {
    console.log('Generating smart contract with user configuration');
    
    try {
      const response = await fetch('/api/deploy/generate-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractConfig: {
            ...contractConfig,
            mintPrice: contractConfig.mintPrice, // Use actual mint price from UI
            maxPerWallet: 10 // Default max per wallet
          },
          metadataConfig,
          royaltyConfig
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Contract generation failed');
      }
      
      const result = await response.json();
      console.log('Contract generation successful:', result);
      
      // Store generated contract for deployment
      // TODO: Update state with generated contract
      
      return result;
      
    } catch (error) {
      console.error('Contract generation error:', error);
      throw error;
    }
  };

  const deployContract = async (ipfsResult?: any) => {
    console.log('Deploying contract to Plasma network using client-side deployment');
    
    try {
      if (!walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      // Get the compiled contract from the deployment API
      const contractResult = await fetch('/api/deploy/deploy-contract-typed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractType: contractConfig.type,
          name: contractConfig.name,
          symbol: contractConfig.symbol,
          maxSupply: contractConfig.maxSupply,
          mintPrice: (contractConfig.mintPrice * 1e18).toString(), // Convert to wei
          baseTokenURI: `https://gen-plasma.com/api/metadata/${contractConfig.type}/`, // Will be updated with actual contract address after deployment
          // Editions-specific data
          ...(contractConfig.type === 'editions' && {
            artworkName: uploadConfig.nftItems?.[0]?.name || 'Untitled Artwork',
            artworkDescription: uploadConfig.nftItems?.[0]?.description || 'A unique digital artwork',
            artworkImage: ipfsResult?.ipfsResults?.[0]?.ipfsUrl || '',
            artistName: metadataConfig.collectionName || 'Unknown Artist'
          }),
          // Pro-specific data
          ...(contractConfig.type === 'pro' && {
            royaltyRecipient: royaltyConfig.recipient || address,
            royaltyPercentage: royaltyConfig.percentage || 2.5,
            onChainStorage: uploadConfig.storageType === 'onchain'
          })
        })
      });

      if (!contractResult.ok) {
        const error = await contractResult.json();
        throw new Error(error.error || 'Contract compilation failed');
      }

      const contractData = await contractResult.json();
      if (!contractData.success) {
        throw new Error('Contract compilation failed');
      }

      // Prepare constructor arguments based on contract type
      let constructorArgs: any[];
      
      switch (contractConfig.type) {
        case 'basic':
          constructorArgs = [
            contractConfig.name, 
            contractConfig.symbol, 
            `https://gen-plasma.com/api/metadata/basic/${contractConfig.name.toLowerCase().replace(/\s+/g, '-')}/`
          ];
          break;
        case 'pro':
          constructorArgs = [
            contractConfig.name, 
            contractConfig.symbol, 
            `https://gen-plasma.com/api/metadata/pro/${contractConfig.name.toLowerCase().replace(/\s+/g, '-')}/`,
            address // User's address as royalty recipient
          ];
          break;
        case 'editions':
          const firstItem = uploadConfig.nftItems?.[0];
          constructorArgs = [
            contractConfig.name, 
            contractConfig.symbol, 
            `https://gen-plasma.com/api/metadata/editions/${contractConfig.name.toLowerCase().replace(/\s+/g, '-')}/`,
            firstItem?.name || 'Untitled Artwork',
            firstItem?.description || 'A unique digital artwork',
            ipfsResult?.ipfsResults?.[0]?.ipfsUrl || '',
            metadataConfig.collectionName || 'Unknown Artist'
          ];
          break;
      }

      console.log('🚀 Deploying contract with args:', constructorArgs);
      console.log('👤 Deploying as user:', address);

      // Deploy contract using user's wallet (this makes them the owner)
      const hash = await walletClient.deployContract({
        abi: contractData.contractABI,
        bytecode: contractData.contractBytecode as `0x${string}`,
        args: constructorArgs,
      });

      console.log('⏳ Waiting for deployment confirmation...');
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const contractAddress = receipt.contractAddress;

      if (!contractAddress) {
        throw new Error('Contract deployment failed - no contract address');
      }

      console.log(`✅ Contract deployed successfully: ${contractAddress}`);
      console.log(`👤 Contract owner: ${address} (user's wallet)`);

      // Auto-verify contract if enabled and not Basic contract
      let verificationResult = null;
      if (deploymentConfig.autoVerify && contractConfig.type !== 'basic') {
        try {
          console.log('🔍 Auto-verifying contract on Plasmascan...');
          
          const verifyResponse = await fetch('/api/verify/verify-contract-hardhat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contractAddress,
              contractType: contractConfig.type,
              contractName: contractConfig.name,
              symbol: contractConfig.symbol,
              baseTokenURI: `https://gen-plasma.com/api/metadata/${contractConfig.type}/${contractConfig.name.toLowerCase().replace(/\s+/g, '-')}/`,
              // Type-specific constructor args
              ...(contractConfig.type === 'pro' && {
                royaltyRecipient: address
              }),
              ...(contractConfig.type === 'editions' && {
                artworkName: uploadConfig.nftItems?.[0]?.name || 'Untitled Artwork',
                artworkDescription: uploadConfig.nftItems?.[0]?.description || 'A unique digital artwork',
                artworkImage: ipfsResult?.ipfsResults?.[0]?.ipfsUrl || '',
                artistName: metadataConfig.collectionName || 'Unknown Artist'
              })
            })
          });

          if (verifyResponse.ok) {
            verificationResult = await verifyResponse.json();
            console.log('✅ Contract verification submitted successfully:', verificationResult);
          } else {
            console.warn('⚠️ Contract verification failed:', await verifyResponse.text());
          }
        } catch (error) {
          console.warn('⚠️ Contract verification error:', error);
        }
      }

      return {
        success: true,
        contractAddress,
        transactionHash: hash,
        message: 'Contract deployed successfully with user as owner',
        verificationResult
      };

    } catch (error) {
      console.error('Contract deployment error:', error);
      throw error;
    }
  };

  const verifyContract = async () => {
    console.log('Verifying contract on Plasmascan');
    
    try {
      // Get the deployment result from the previous step
      const deploymentResult = await deployContract();
      
      // Prepare verification data
      const verificationData = {
        contractAddress: deploymentResult.contractAddress,
        contractType: contractConfig.type,
        contractName: contractConfig.name,
        symbol: contractConfig.symbol,
        baseTokenURI: `https://gen-plasma.com/api/metadata/${contractConfig.type}/`, // Will be updated with actual contract address after deployment
        // Type-specific data
        ...(contractConfig.type === 'pro' && { 
          royaltyRecipient: royaltyConfig.recipient || address 
        }),
        ...(contractConfig.type === 'editions' && {
          artworkName: uploadConfig.nftItems[0]?.name || 'Artwork',
          artworkDescription: uploadConfig.nftItems[0]?.description || 'Description',
          artworkImage: uploadConfig.nftItems[0]?.imagePreview || '',
          artistName: metadataConfig.collectionName || 'Artist'
        })
      };

      const response = await fetch('/api/verify/verify-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification failed');
      }

      const result = await response.json();
      console.log('Contract verification submitted:', result);
      
      return result;
      
    } catch (error) {
      console.error('Contract verification error:', error);
      throw error;
    }
  };

  const generateDeploymentId = () => {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const availableSteps = getAvailableSteps(contractConfig.type);
  
  const allSteps = [
    {
      id: 'contract' as BuilderStep,
      title: 'Contract Type',
      description: 'Choose your NFT contract configuration',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'metadata' as BuilderStep,
      title: 'Metadata',
      description: 'Configure collection information and attributes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    },
    {
      id: 'upload' as BuilderStep,
      title: 'Upload & Assets',
      description: 'Upload images and configure individual NFT metadata',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )
    },
    {
      id: 'royalty' as BuilderStep,
      title: 'Royalty Options',
      description: 'Set up creator royalties and revenue sharing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    {
      id: 'deployment' as BuilderStep,
      title: 'Deployment & Mint',
      description: 'Deploy contract and configure minting',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  // Filter steps based on contract type
  const steps = allSteps.filter(step => availableSteps.includes(step.id));

  const renderContractStep = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Contract Configuration</h2>
        <p className="text-gray-400">Choose your contract type and basic settings</p>
      </div>

      {/* Contract Type Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Contract Type</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div 
            className={`glass-card p-6 cursor-pointer transition-all duration-200 ${
              contractConfig.type === 'basic' 
                ? 'border-forest-500/50 bg-forest-500/10' 
                : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => {
              const newMaxSupply = contractConfig.maxSupply > 1000 ? 1000 : contractConfig.maxSupply;
              setContractConfig({
                ...contractConfig, 
                type: 'basic',
                maxSupply: newMaxSupply
              });
              // Disable Pro-only features when switching to Basic
              setDeploymentConfig({
                ...deploymentConfig,
                autoVerify: false,
                createMintSite: false
              });
              // Reset to IPFS storage for Basic tier
              setUploadConfig({
                ...uploadConfig,
                storageType: 'ipfs'
              });
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-white">Basic Collection</h4>
              <div className="text-right">
                <span className="text-forest-300 font-bold text-lg">18 XPL</span>
                {isGenPlasmaHolder && (
                  <div className="text-xs text-yellow-400">50% OFF</div>
                )}
              </div>
            </div>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Standard ERC-721 contract</li>
              <li>• Up to 1,000 tokens</li>
              <li>• Custom mint page</li>
              <li>• Community support</li>
            </ul>
          </div>

          <div 
            className={`glass-card p-6 cursor-pointer transition-all duration-200 ${
              contractConfig.type === 'pro' 
                ? 'border-forest-500/50 bg-forest-500/10' 
                : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setContractConfig({...contractConfig, type: 'pro'})}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-white">Pro Collection</h4>
              <div className="text-right">
                <span className="text-forest-300 font-bold text-lg">35 XPL</span>
                {isGenPlasmaHolder && (
                  <div className="text-xs text-yellow-400">50% OFF</div>
                )}
              </div>
            </div>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Advanced contract features</li>
              <li>• Up to 10,000 tokens</li>
              <li>• Merkle tree whitelist support</li>
              <li>• Royalty management (EIP-2981)</li>
              <li>• Custom mint page</li>
              <li>• Priority verification</li>
              <li>• Developer support</li>
            </ul>
            <div className="mt-3">
              <span className="text-xs bg-forest-500/20 text-forest-300 px-2 py-1 rounded-full">
                Recommended
              </span>
            </div>
          </div>

          <div 
            className={`glass-card p-6 cursor-pointer transition-all duration-200 ${
              contractConfig.type === 'editions' 
                ? 'border-purple-500/50 bg-purple-500/10' 
                : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setContractConfig({
              ...contractConfig, 
              type: 'editions',
              maxSupply: 1000,
              maxPerWallet: 5
            })}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-white">Editions</h4>
              <div className="text-right">
                <span className="text-purple-300 font-bold text-lg">22 XPL</span>
                {isGenPlasmaHolder && (
                  <div className="text-xs text-yellow-400">50% OFF</div>
                )}
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
                For Artists
              </span>
            </div>
          </div>

          <div 
            className="glass-card p-6 cursor-pointer transition-all duration-200 border-white/10 hover:border-purple-400/50 hover:bg-purple-400/5 relative overflow-hidden"
            onClick={() => window.location.href = '/inscriptions'}
          >
            <div className="absolute top-2 right-2">
              <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded-full font-semibold">
                Available Now!
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                Inscriptions
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </h4>
              <div className="text-right">
                <span className="text-purple-400 font-bold text-lg">6 XPL</span>
                {isGenPlasmaHolder && (
                  <div className="text-xs text-yellow-400">50% OFF</div>
                )}
              </div>
            </div>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Permanent on-chain data</li>
              <li>• Pixel art editor included</li>
              <li>• Image optimization (96KB max)</li>
              <li>• No smart contract required</li>
              <li>• Instant inscription</li>
            </ul>
            <div className="mt-3">
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                Data Layer
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white">Basic Settings</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contract Name *
            </label>
            <input
              type="text"
              value={contractConfig.name}
              onChange={(e) => setContractConfig({...contractConfig, name: e.target.value})}
              placeholder="My NFT Collection"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Symbol *
            </label>
            <input
              type="text"
              value={contractConfig.symbol}
              onChange={(e) => setContractConfig({...contractConfig, symbol: e.target.value.toUpperCase()})}
              placeholder="MNC"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Supply
              <span className="ml-2 text-xs text-gray-500">
                {contractConfig.type === 'pro' || contractConfig.type === 'basic'
                  ? '(Auto-determined by NFT items)' 
                  : contractConfig.type === 'editions' 
                    ? '(Max: 1,000)' 
                    : '(Max: 10,000)'
                }
              </span>
            </label>
            <input
              type="number"
              min="1"
              max={contractConfig.type === 'basic' ? 1000 : contractConfig.type === 'editions' ? 1000 : 10000}
              value={contractConfig.maxSupply}
              onChange={(e) => {
                // For Pro contracts, max supply is auto-determined, so don't allow manual changes
                if (contractConfig.type === 'pro') {
                  return;
                }
                
                const value = parseInt(e.target.value) || 0;
                let maxAllowed;
                switch (contractConfig.type) {
                  case 'basic':
                    maxAllowed = 1000;
                    break;
                  case 'editions':
                    maxAllowed = 1000;
                    break;
                  default:
                    maxAllowed = 10000;
                }
                const clampedValue = Math.min(Math.max(value, 1), maxAllowed);
                setContractConfig({...contractConfig, maxSupply: clampedValue});
              }}
              placeholder={
                contractConfig.type === 'basic' || contractConfig.type === 'pro' ? 'Auto-determined' : 
                '100'
              }
              disabled={contractConfig.type === 'pro' || contractConfig.type === 'basic'}
              className={`w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors ${
                contractConfig.type === 'pro' || contractConfig.type === 'basic' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            {contractConfig.maxSupply > (
              contractConfig.type === 'basic' ? 1000 : 
              contractConfig.type === 'pro' ? 10000 : 
              1000
            ) && (
              <p className="text-red-400 text-xs mt-1">
                {contractConfig.type === 'basic' 
                  ? 'Basic collections are limited to 1,000 NFTs. Upgrade to Pro for up to 10,000.'
                  : contractConfig.type === 'pro'
                  ? 'Pro collections are limited to 10,000 NFTs. Contact us for larger collections.'
                  : 'Editions are limited to 1,000 copies. Perfect for digital art and photography.'
                }
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {contractConfig.type === 'basic' 
                ? 'Need more than 1,000? Upgrade to Pro tier.'
                : 'Need more than 10,000? Contact our team for enterprise solutions.'
              }
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mint Price (XPL)
            </label>
            <input
              type="number"
              step="0.001"
              value={contractConfig.mintPrice}
              onChange={(e) => setContractConfig({...contractConfig, mintPrice: parseFloat(e.target.value) || 0})}
              placeholder="0.01"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Per Wallet
            </label>
            <input
              type="number"
              value={contractConfig.maxPerWallet}
              onChange={(e) => setContractConfig({...contractConfig, maxPerWallet: parseInt(e.target.value) || 0})}
              placeholder="10"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderMetadataStep = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Collection Metadata</h2>
        <p className="text-gray-400">Configure your collection's information and attributes</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Collection Name *
          </label>
          <input
            type="text"
            value={metadataConfig.collectionName}
            onChange={(e) => setMetadataConfig({...metadataConfig, collectionName: e.target.value})}
            placeholder="My Amazing NFT Collection"
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            rows={4}
            value={metadataConfig.description}
            onChange={(e) => setMetadataConfig({...metadataConfig, description: e.target.value})}
            placeholder="Describe your collection, its story, and what makes it unique..."
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors resize-none"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Collection Image URL
            </label>
            <input
              type="url"
              value={metadataConfig.image}
              onChange={(e) => setMetadataConfig({...metadataConfig, image: e.target.value})}
              placeholder="https://example.com/collection-image.png"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              External URL
            </label>
            <input
              type="url"
              value={metadataConfig.externalUrl}
              onChange={(e) => setMetadataConfig({...metadataConfig, externalUrl: e.target.value})}
              placeholder="https://your-website.com"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
            />
          </div>
        </div>

        {/* Editions Artwork Metadata Section */}
        {contractConfig.type === 'editions' && (
          <div className="space-y-6 p-6 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold text-purple-300 mb-2">🎨 Editions Artwork Metadata</h3>
              <p className="text-sm text-purple-200">Configure the artwork information that will appear in your NFT metadata</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Artwork Name *
                </label>
                <input
                  type="text"
                  value={metadataConfig.artworkName}
                  onChange={(e) => setMetadataConfig({...metadataConfig, artworkName: e.target.value})}
                  placeholder="My Amazing Artwork"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">This will appear as "Artwork Name" in NFT metadata</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Artist Name *
                </label>
                <input
                  type="text"
                  value={metadataConfig.artistName}
                  onChange={(e) => setMetadataConfig({...metadataConfig, artistName: e.target.value})}
                  placeholder="Your Artist Name"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">This will appear as "Artist" in NFT metadata</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Artwork Description *
              </label>
              <textarea
                rows={3}
                value={metadataConfig.artworkDescription}
                onChange={(e) => setMetadataConfig({...metadataConfig, artworkDescription: e.target.value})}
                placeholder="Describe your artwork, its inspiration, technique, and what makes it special..."
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-colors resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">This will appear in the NFT description for each edition</p>
            </div>

            {/* Optional Custom Traits */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Traits (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">Add custom attributes that will appear in NFT metadata (e.g., Medium, Year, Style)</p>
              
              <div className="space-y-3">
                {metadataConfig.attributes.map((attr, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center">
                    <input
                      type="text"
                      value={attr.trait_type}
                      onChange={(e) => {
                        const newAttrs = [...metadataConfig.attributes];
                        newAttrs[index].trait_type = e.target.value;
                        setMetadataConfig({...metadataConfig, attributes: newAttrs});
                      }}
                      placeholder="Trait Type (e.g., Medium, Year, Style)"
                      className="col-span-5 p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-colors"
                    />
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => {
                        const newAttrs = [...metadataConfig.attributes];
                        newAttrs[index].value = e.target.value;
                        setMetadataConfig({...metadataConfig, attributes: newAttrs});
                      }}
                      placeholder="Value (e.g., Digital Art, 2024, Abstract)"
                      className="col-span-5 p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-colors"
                    />
                    <button
                      onClick={() => {
                        const newAttrs = metadataConfig.attributes.filter((_, i) => i !== index);
                        setMetadataConfig({...metadataConfig, attributes: newAttrs});
                      }}
                      className="col-span-2 p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={() => setMetadataConfig({
                    ...metadataConfig,
                    attributes: [...metadataConfig.attributes, { trait_type: '', value: '' }]
                  })}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 transition-colors text-sm"
                >
                  + Add Custom Trait
                </button>
              </div>
            </div>

            <div className="bg-purple-800/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-purple-300 mb-2">📋 Metadata Preview</h4>
              <div className="text-xs text-gray-300 space-y-1">
                <p><strong>Artwork Name:</strong> {metadataConfig.artworkName || 'My Amazing Artwork'}</p>
                <p><strong>Artist:</strong> {metadataConfig.artistName || 'Your Artist Name'}</p>
                <p><strong>Description:</strong> {metadataConfig.artworkDescription || 'A unique digital artwork'}</p>
                {metadataConfig.attributes.length > 0 && (
                  <div className="mt-2">
                    <p><strong>Custom Traits:</strong></p>
                    {metadataConfig.attributes.map((attr, index) => (
                      <p key={index} className="ml-2">
                        • {attr.trait_type || 'Trait Type'}: {attr.value || 'Value'}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Attributes Section */}
        {contractConfig.type === 'editions' ? (
          <div className="space-y-4 opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-400">Collection Trait Types</h3>
                <p className="text-sm text-gray-500 mt-1">Not used for Editions - all tokens share the same metadata</p>
              </div>
              <span className="text-xs bg-gray-600/30 text-gray-400 px-2 py-1 rounded-full">
                Not Used for Editions
              </span>
            </div>
            <div className="text-center py-8 text-gray-500">
              <p>Collection trait types are not needed for Editions contracts.</p>
              <p className="text-sm mt-2">All editions share the same artwork and metadata configured above.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Collection Trait Types</h3>
                <p className="text-sm text-gray-400 mt-1">Define trait categories that will be available for individual NFTs</p>
              </div>
              <button
                onClick={() => setMetadataConfig({
                  ...metadataConfig,
                  attributes: [...metadataConfig.attributes, { trait_type: '', value: '' }]
                })}
                className="px-4 py-2 bg-forest-500/20 hover:bg-forest-500/30 border border-forest-500/30 rounded-lg text-forest-300 text-sm font-medium transition-colors"
              >
                Add Trait Type
              </button>
            </div>

            {metadataConfig.attributes.map((attr, index) => (
              <div key={index} className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={attr.trait_type}
                  onChange={(e) => {
                    const newAttrs = [...metadataConfig.attributes];
                    newAttrs[index].trait_type = e.target.value;
                    setMetadataConfig({...metadataConfig, attributes: newAttrs});
                  }}
                  placeholder="Trait Type (e.g., Background, Rarity, Color)"
                  className="p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
                />
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={attr.value}
                    onChange={(e) => {
                      const newAttrs = [...metadataConfig.attributes];
                      newAttrs[index].value = e.target.value;
                      setMetadataConfig({...metadataConfig, attributes: newAttrs});
                    }}
                    placeholder="Example value (optional)"
                    className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
                  />
                  <button
                    onClick={() => {
                      const newAttrs = metadataConfig.attributes.filter((_, i) => i !== index);
                      setMetadataConfig({...metadataConfig, attributes: newAttrs});
                    }}
                    className="px-3 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {metadataConfig.attributes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No trait types defined yet. Click "Add Trait Type" to create categories like Background, Rarity, Color, etc.</p>
                <p className="text-sm mt-2">These will be available as dropdowns when configuring individual NFTs.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderUploadStep = () => {
    const addNFTItem = () => {
      const newItem: NFTItem = {
        id: Date.now().toString(),
        name: '',
        description: '',
        image: null,
        imagePreview: '',
        attributes: []
      };
      setUploadConfig({
        ...uploadConfig,
        nftItems: [...uploadConfig.nftItems, newItem]
      });
    };

    const updateNFTItem = (id: string, updates: Partial<NFTItem>) => {
      // Clean up old object URL if updating imagePreview
      if (updates.imagePreview) {
        const oldItem = uploadConfig.nftItems.find(item => item.id === id);
        if (oldItem?.imagePreview && oldItem.imagePreview.startsWith('blob:')) {
          URL.revokeObjectURL(oldItem.imagePreview);
        }
      }
      
      setUploadConfig({
        ...uploadConfig,
        nftItems: uploadConfig.nftItems.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      });
    };

    const removeNFTItem = (id: string) => {
      // Clean up object URL before removing item
      const itemToRemove = uploadConfig.nftItems.find(item => item.id === id);
      if (itemToRemove?.imagePreview && itemToRemove.imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(itemToRemove.imagePreview);
      }
      
      setUploadConfig({
        ...uploadConfig,
        nftItems: uploadConfig.nftItems.filter(item => item.id !== id)
      });
    };

    const handleImageUpload = (id: string, file: File) => {
      // Create object URL for preview instead of base64 to avoid URL length issues
      const previewUrl = URL.createObjectURL(file);
      updateNFTItem(id, {
        image: file,
        imagePreview: previewUrl
      });
    };

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Upload & Assets</h2>
          <p className="text-gray-400">
            {contractConfig.type === 'editions' 
              ? 'Upload your artwork that will be minted as multiple editions'
              : contractConfig.type === 'pro'
                ? 'Upload high-quality images (up to 4K) and configure individual NFT metadata. Max supply will be automatically set to the number of NFTs you add.'
                : 'Upload images and configure individual NFT metadata'
            }
          </p>
          {contractConfig.type === 'pro' && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-300">
                  <strong>Pro Collection:</strong> Each NFT you add will be mintable once. The max supply ({uploadConfig.nftItems.length} NFTs) is automatically determined by the number of items you upload. Images are optimized to WebP format with 4K resolution support for maximum quality.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Method Selection - Different for Editions */}
        {contractConfig.type === 'editions' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Edition Artwork</h3>
            
            {/* File Upload for Editions */}
            <div className="glass-card p-6 border border-purple-500/20 bg-purple-500/5">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-2">Single Artwork, Multiple Editions</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Upload one artwork that will be minted as {contractConfig.maxSupply} identical editions. 
                      Each edition will have a unique token number but the same image and metadata.
                    </p>
                  </div>
                </div>
                
                {/* File Upload Input */}
                <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setUploadConfig({
                            ...uploadConfig,
                            editionsArtwork: {
                              file: file,
                              preview: e.target?.result as string
                            }
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="editions-upload"
                  />
                  <label htmlFor="editions-upload" className="cursor-pointer">
                    {uploadConfig.editionsArtwork?.preview ? (
                      <div className="space-y-3">
                        <img 
                          src={uploadConfig.editionsArtwork.preview} 
                          alt="Edition artwork preview" 
                          className="mx-auto max-w-xs max-h-48 object-contain rounded-lg"
                        />
                        <p className="text-sm text-purple-300">Click to change artwork</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <svg className="mx-auto w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div>
                          <p className="text-white font-medium">Upload Edition Artwork</p>
                          <p className="text-sm text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                
                <div className="text-xs text-purple-300 bg-purple-500/10 px-3 py-2 rounded-lg">
                  💡 Perfect for digital art, photography, and limited releases where you want multiple copies of the same piece.
                </div>
              </div>
            </div>

            {/* Dimmed NFT Items Section */}
            <div className="glass-card p-6 border border-gray-600/20 bg-gray-800/20 opacity-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-400">Individual NFT Items</h3>
                <span className="text-xs bg-gray-600/30 text-gray-400 px-2 py-1 rounded-full">
                  Not Used for Editions
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Individual NFT configuration is not needed for Editions contracts. 
                All editions will share the same metadata and artwork you've configured above.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Upload Method</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div 
                className={`glass-card p-4 cursor-pointer transition-all duration-200 ${
                  uploadConfig.uploadMethod === 'individual' 
                    ? 'border-forest-500/50 bg-forest-500/10' 
                    : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => setUploadConfig({...uploadConfig, uploadMethod: 'individual'})}
              >
                <h4 className="font-semibold text-white mb-2">Individual Upload</h4>
                <p className="text-sm text-gray-400">Upload and configure each NFT individually</p>
              </div>

              <div 
                className={`glass-card p-4 cursor-pointer transition-all duration-200 ${
                  uploadConfig.uploadMethod === 'batch' 
                    ? 'border-forest-500/50 bg-forest-500/10' 
                    : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => setUploadConfig({...uploadConfig, uploadMethod: 'batch'})}
              >
                <h4 className="font-semibold text-white mb-2">Batch Upload</h4>
                <p className="text-sm text-gray-400">Upload multiple images with CSV metadata</p>
                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full mt-2 inline-block">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Storage Type Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Storage Type</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div 
              className={`glass-card p-6 cursor-pointer transition-all duration-200 ${
                uploadConfig.storageType === 'ipfs' 
                  ? 'border-forest-500/50 bg-forest-500/10' 
                  : 'border-white/10 hover:border-white/20'
              }`}
              onClick={() => setUploadConfig({...uploadConfig, storageType: 'ipfs'})}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-white">IPFS Storage</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-green-400">Included</span>
                </div>
              </div>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Decentralized off-chain storage</li>
                <li>• Fast loading and retrieval</li>
                <li>• Marketplace compatible</li>
                <li>• Industry standard</li>
              </ul>
            </div>

            {/* On-chain storage option temporarily hidden - not fully implemented */}
            {false && (
            <div 
              className={`glass-card p-6 cursor-pointer transition-all duration-200 relative ${
                contractConfig.type === 'basic' || contractConfig.type === 'editions'
                  ? 'opacity-50 cursor-not-allowed' 
                  : uploadConfig.storageType === 'onchain' 
                    ? 'border-forest-500/50 bg-forest-500/10' 
                    : 'border-white/10 hover:border-white/20'
              }`}
              onClick={() => {
                if (contractConfig.type === 'pro') {
                  setUploadConfig({...uploadConfig, storageType: 'onchain'});
                }
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-white">On-Chain Storage</h4>
                <div className="flex items-center space-x-2">
                  {contractConfig.type === 'basic' || contractConfig.type === 'editions' ? (
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
                      Pro Only
                    </span>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="text-xs text-orange-400">+1.2 XPL</span>
                    </>
                  )}
                </div>
              </div>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Essential metadata on blockchain</li>
                <li>• Small images only (SVG/pixel art)</li>
                <li>• Maximum permanence & security</li>
                <li>• Higher gas costs</li>
              </ul>
              {contractConfig.type === 'basic' && (
                <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-yellow-300 text-sm font-medium">Upgrade to Pro</p>
                    <p className="text-yellow-200/80 text-xs">for on-chain storage</p>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>

          {/* Storage Type Information */}
          {uploadConfig.storageType === 'ipfs' && (
            <div className="glass-card p-4 border border-forest-500/20 bg-forest-500/5">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-forest-500/20 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-forest-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">IPFS Storage Selected</h4>
                  <p className="text-gray-400 text-sm">
                    Your NFT images and metadata will be stored on IPFS for decentralized access. 
                    Storage costs are included in your deployment fee.
                  </p>
                </div>
              </div>
            </div>
          )}

          {uploadConfig.storageType === 'onchain' && contractConfig.type === 'pro' && (
            <div className="glass-card p-4 border border-blue-500/20 bg-blue-500/5">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">On-Chain Storage Selected</h4>
                  <p className="text-gray-400 text-sm">
                    Essential metadata will be stored directly on the Plasma blockchain. Only small images 
                    (SVG, pixel art) can be stored on-chain due to size limitations.
                  </p>
                  <div className="mt-2 text-xs text-blue-300">
                    ⚠️ Size limits apply: ~24KB max per NFT metadata
                  </div>
                  <div className="mt-1 text-xs text-yellow-300">
                    💡 Large images will automatically use IPFS with on-chain hash
                  </div>
                  <div className="mt-2 text-xs text-orange-300">
                    💰 Additional cost: +1.2 XPL for on-chain storage
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Individual NFT Items */}
        {uploadConfig.uploadMethod === 'individual' && contractConfig.type !== 'editions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">NFT Items ({uploadConfig.nftItems.length})</h3>
              <div className="flex space-x-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleBatchFileUpload}
                  className="hidden"
                  id="add-more-upload"
                />
                <label
                  htmlFor="add-more-upload"
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 text-sm font-medium transition-colors cursor-pointer"
                >
                  Add Multiple
                </label>
                <button
                  onClick={addNFTItem}
                  className="px-4 py-2 bg-forest-500/20 hover:bg-forest-500/30 border border-forest-500/30 rounded-lg text-forest-300 text-sm font-medium transition-colors"
                >
                  Add One
                </button>
              </div>
            </div>

            {uploadConfig.nftItems.length === 0 ? (
              <DragDropUploadArea 
                onFilesSelected={handleBatchFileUpload}
                onSingleAdd={addNFTItem}
                maxFiles={contractConfig.type === 'pro' || contractConfig.type === 'basic' ? 100 : 50}
                contractType={contractConfig.type}
              />
            ) : (
              <div className="space-y-6">
                {uploadConfig.nftItems.map((item, index) => (
                  <div key={item.id} className="glass-card p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">NFT #{index + 1}</h4>
                      <button
                        onClick={() => removeNFTItem(item.id)}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-300 text-sm transition-colors"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Image *
                        </label>
                        <div className="space-y-4">
                          <div 
                            className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-forest-500/50 transition-colors cursor-pointer"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) handleImageUpload(item.id, file);
                              };
                              input.click();
                            }}
                          >
                            {item.imagePreview ? (
                              <div className="space-y-2">
                                <img 
                                  src={item.imagePreview} 
                                  alt="Preview" 
                                  className="w-32 h-32 object-cover rounded-lg mx-auto"
                                />
                                <p className="text-sm text-gray-400">Click to change image</p>
                                {uploadConfig.storageType === 'onchain' && item.image && item.image.size > 24000 && (
                                  <div className="text-xs text-yellow-400 text-center mt-2">
                                    ⚠️ Large image will use IPFS + on-chain hash
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <svg className="w-12 h-12 text-gray-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-gray-400">Click to upload image</p>
                                <p className="text-xs text-gray-500">
                                  {uploadConfig.storageType === 'onchain' 
                                    ? 'SVG/small images recommended for on-chain storage'
                                    : 'PNG, JPG, GIF up to 10MB'
                                  }
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateNFTItem(item.id, { name: e.target.value })}
                            placeholder="NFT Name"
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            value={item.description}
                            onChange={(e) => updateNFTItem(item.id, { description: e.target.value })}
                            placeholder="Describe this NFT..."
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors resize-none"
                          />
                        </div>

                        {/* Attributes */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-300">
                              Attributes
                            </label>
                            <button
                              onClick={() => {
                                const newAttributes = [...item.attributes, { trait_type: '', value: '' }];
                                updateNFTItem(item.id, { attributes: newAttributes });
                              }}
                              disabled={metadataConfig.attributes.length === 0}
                              className="text-xs px-2 py-1 bg-forest-500/20 hover:bg-forest-500/30 border border-forest-500/30 rounded text-forest-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-500/20 disabled:border-gray-500/30 disabled:text-gray-500"
                              title={metadataConfig.attributes.length === 0 ? "Add trait types in the Metadata step first" : "Add attribute"}
                            >
                              Add
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {item.attributes.map((attr, attrIndex) => (
                              <div key={attrIndex} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-5">
                                  <select
                                    value={attr.trait_type}
                                    onChange={(e) => {
                                      const newAttributes = [...item.attributes];
                                      newAttributes[attrIndex].trait_type = e.target.value;
                                      // Reset value when trait type changes
                                      newAttributes[attrIndex].value = '';
                                      updateNFTItem(item.id, { attributes: newAttributes });
                                    }}
                                    className="w-full p-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
                                  >
                                    <option value="" className="bg-gray-800">Select Trait Type</option>
                                    {metadataConfig.attributes.map((collectionAttr, idx) => (
                                      <option key={idx} value={collectionAttr.trait_type} className="bg-gray-800">
                                        {collectionAttr.trait_type}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-span-6">
                                  <input
                                    type="text"
                                    value={attr.value}
                                    onChange={(e) => {
                                      const newAttributes = [...item.attributes];
                                      newAttributes[attrIndex].value = e.target.value;
                                      updateNFTItem(item.id, { attributes: newAttributes });
                                    }}
                                    placeholder={attr.trait_type ? `Enter ${attr.trait_type} value` : "Select trait type first"}
                                    disabled={!attr.trait_type}
                                    className="w-full p-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 text-sm focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </div>
                                <div className="col-span-1 flex justify-center">
                                  <button
                                    onClick={() => {
                                      const newAttributes = item.attributes.filter((_, i) => i !== attrIndex);
                                      updateNFTItem(item.id, { attributes: newAttributes });
                                    }}
                                    className="w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-300 text-sm transition-colors flex-shrink-0"
                                    title="Remove attribute"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            ))}
                            
                            {metadataConfig.attributes.length === 0 && (
                              <div className="text-center py-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <p className="text-yellow-300 text-sm">
                                  No trait types defined. Go back to the Metadata step to add collection attributes first.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Batch Upload (Coming Soon) */}
        {uploadConfig.uploadMethod === 'batch' && (
          <div className="glass-card p-8 text-center border border-yellow-500/20 bg-yellow-500/5">
            <svg className="w-12 h-12 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-yellow-300 mb-2">Batch Upload Coming Soon</h3>
            <p className="text-yellow-200/80 mb-4">
              Upload hundreds of NFTs at once with CSV metadata import. This feature will be available in the next update.
            </p>
            <button
              onClick={() => setUploadConfig({...uploadConfig, uploadMethod: 'individual'})}
              className="px-6 py-3 bg-forest-500 hover:bg-forest-600 text-white font-medium rounded-lg transition-colors"
            >
              Use Individual Upload Instead
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderRoyaltyStep = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Royalty Configuration</h2>
        <p className="text-gray-400">Set up creator royalties for secondary sales</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="enableRoyalties"
            checked={royaltyConfig.enabled}
            onChange={(e) => setRoyaltyConfig({...royaltyConfig, enabled: e.target.checked})}
            className="w-4 h-4 text-forest-500 bg-white/5 border-white/20 rounded focus:ring-forest-500/20 focus:ring-2"
          />
          <label htmlFor="enableRoyalties" className="text-white font-medium">
            Enable Creator Royalties
          </label>
        </div>

        {royaltyConfig.enabled && (
          <div className="space-y-6 pl-7">
            <div className="glass-card p-6 border border-forest-500/20">
              <h3 className="text-lg font-semibold text-white mb-4">Royalty Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Royalty Recipient Address *
                  </label>
                  <input
                    type="text"
                    value={royaltyConfig.recipient}
                    onChange={(e) => setRoyaltyConfig({...royaltyConfig, recipient: e.target.value})}
                    placeholder="0x..."
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forest-500/50 focus:ring-1 focus:ring-forest-500/20 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Address that will receive royalty payments from secondary sales
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Royalty Percentage
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={royaltyConfig.percentage}
                      onChange={(e) => setRoyaltyConfig({...royaltyConfig, percentage: parseFloat(e.target.value)})}
                      className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-forest-300 font-semibold min-w-[3rem]">
                      {royaltyConfig.percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Percentage of secondary sale price paid to creator (0-10%)
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-forest-500/10 border border-forest-500/20 rounded-lg">
                <h4 className="text-sm font-semibold text-forest-300 mb-2">Royalty Preview</h4>
                <div className="text-sm text-gray-400">
                  <p>• On a 1 XPL secondary sale, you'll receive {(royaltyConfig.percentage / 100).toFixed(3)} XPL</p>
                  <p>• On a 10 XPL secondary sale, you'll receive {(royaltyConfig.percentage / 10).toFixed(2)} XPL</p>
                  <p>• Royalties are automatically enforced by EIP-2981 standard</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!royaltyConfig.enabled && (
          <div className="glass-card p-6 border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-yellow-300 font-medium mb-1">Royalties Disabled</h4>
                <p className="text-yellow-200/80 text-sm">
                  Without royalties, you won't receive any revenue from secondary sales of your NFTs. 
                  Consider enabling royalties to earn ongoing income from your collection.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderDeploymentStep = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Deployment & Minting</h2>
        <p className="text-gray-400">Configure deployment settings and minting options</p>
      </div>

      <div className="space-y-6">
        {/* Network Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Network Selection</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div 
              className={`glass-card p-4 cursor-pointer transition-all duration-200 ${
                deploymentConfig.network === 'plasma' 
                  ? 'border-forest-500/50 bg-forest-500/10' 
                  : 'border-white/10 hover:border-white/20'
              }`}
              onClick={() => setDeploymentConfig({...deploymentConfig, network: 'plasma'})}
            >
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <h4 className="font-semibold text-white">Plasma Mainnet</h4>
                  <p className="text-sm text-gray-400">Production network - real XPL required</p>
                </div>
              </div>
            </div>

            <div 
              className={`glass-card p-4 cursor-pointer transition-all duration-200 ${
                deploymentConfig.network === 'plasma-testnet' 
                  ? 'border-forest-500/50 bg-forest-500/10' 
                  : 'border-white/10 hover:border-white/20'
              }`}
              onClick={() => setDeploymentConfig({...deploymentConfig, network: 'plasma-testnet'})}
            >
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <h4 className="font-semibold text-white">Plasma Testnet</h4>
                  <p className="text-sm text-gray-400">Testing network - free testnet XPL</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deployment Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Deployment Options</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 opacity-50">
              <input
                type="checkbox"
                id="autoVerify"
                checked={false}
                onChange={(e) => {}}
                disabled={true}
                className="w-4 h-4 text-forest-500 bg-white/5 border-white/20 rounded focus:ring-forest-500/20 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="autoVerify" className="font-medium text-gray-500 cursor-not-allowed">
                Auto-verify contract on Plasmascan
                <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                  Soon
                </span>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="createMintSite"
                checked={deploymentConfig.createMintSite}
                onChange={(e) => setDeploymentConfig({...deploymentConfig, createMintSite: e.target.checked})}
                disabled={false}
                className="w-4 h-4 text-forest-500 bg-white/5 border-white/20 rounded focus:ring-forest-500/20 focus:ring-2"
              />
              <label htmlFor="createMintSite" className="font-medium text-white">
                Create custom mint page
              </label>
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="glass-card p-6 border border-forest-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Deployment Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Contract Type:</span>
              <span className="text-white font-medium capitalize">{contractConfig.type} Collection</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Network:</span>
              <span className="text-white font-medium">
                {deploymentConfig.network === 'plasma' ? 'Plasma Mainnet' : 'Plasma Testnet'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Auto-verification:</span>
              <span className={`font-medium ${contractConfig.type === 'basic' ? 'text-gray-500' : 'text-white'}`}>
                {contractConfig.type === 'basic' 
                  ? 'Not available (Pro only)' 
                  : deploymentConfig.autoVerify ? 'Enabled' : 'Disabled'
                }
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Custom mint page:</span>
              <span className={`font-medium ${contractConfig.type === 'basic' ? 'text-gray-500' : 'text-white'}`}>
                {contractConfig.type === 'basic' 
                  ? 'Not available (Pro only)' 
                  : deploymentConfig.createMintSite ? 'Included' : 'Not included'
                }
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Storage type:</span>
              <span className="text-white font-medium">
                {uploadConfig.storageType === 'onchain' ? 'On-Chain' : 'IPFS'} Storage
                {uploadConfig.storageType === 'onchain' && (
                  <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                    Premium
                  </span>
                )}
              </span>
            </div>
            
            <div className="border-t border-white/10 pt-3 mt-4">
              {uploadConfig.storageType === 'onchain' && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">On-chain storage fee:</span>
                  <span className="text-orange-300 font-medium">
                    +{contractConfig.type === 'basic' ? 0.7 : contractConfig.type === 'pro' ? 1.2 : 0.5} XPL
                  </span>
                </div>
              )}
              {isGenPlasmaHolder && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Gen-Plasma Holder Discount:</span>
                  <span className="text-yellow-300 font-medium">
                    -50%
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-white">Total Cost:</span>
                <span className="text-xl font-bold text-forest-300">
                  {getTotalCost()} XPL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Deployment Status */}
        {deploymentStatus && (
          <div className="mb-6 glass-card p-4 border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center space-x-3">
              {isDeploying ? (
                <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : deploymentStatus.includes('successful') ? (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : deploymentStatus.includes('failed') ? (
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-5 h-5 bg-blue-400 rounded-full"></div>
              )}
              <span className={`font-medium ${
                deploymentStatus.includes('successful') ? 'text-green-300' :
                deploymentStatus.includes('failed') ? 'text-red-300' :
                'text-blue-300'
              }`}>
                {deploymentStatus}
              </span>
            </div>
          </div>
        )}

        {/* Deploy Button */}
        <div className="text-center pt-4">
          <button 
            onClick={() => handleDeployment()}
            disabled={!isFormValid() || isDeploying}
            className="px-8 py-4 bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-none"
          >
            {isDeploying ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deploying Collection...
              </>
            ) : (
              'Deploy Collection'
            )}
          </button>
          <p className="text-sm text-gray-500 mt-3">
            {!isFormValid() 
              ? "Please complete all required fields to deploy"
              : isDeploying
              ? "Deployment in progress, please wait..."
              : "Click to pay deployment fee and deploy your collection"
            }
          </p>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'contract':
        return renderContractStep();
      case 'metadata':
        return renderMetadataStep();
      case 'upload':
        return renderUploadStep();
      case 'royalty':
        return renderRoyaltyStep();
      case 'deployment':
        return renderDeploymentStep();
      default:
        return renderContractStep();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{ backgroundColor: '#020402' }}>
      <div>
        <Header />
        
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <div className="w-80 bg-black/50 backdrop-blur-xl border-r border-white/10 p-6">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Collection Builder</h1>
              <p className="text-gray-400 text-sm">Create your NFT collection step by step</p>
            </div>

            <nav className="space-y-2">
              {steps.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={`w-full flex items-center space-x-3 p-4 rounded-lg transition-all duration-200 text-left ${
                      isActive
                        ? 'bg-forest-500/20 border border-forest-500/30 text-forest-300'
                        : isCompleted
                        ? 'bg-green-500/10 border border-green-500/20 text-green-300 hover:bg-green-500/20'
                        : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className={`flex-shrink-0 ${isActive ? 'text-forest-400' : isCompleted ? 'text-green-400' : 'text-gray-400'}`}>
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{step.title}</div>
                      <div className="text-xs opacity-75 truncate">{step.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Progress */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.round(((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-forest-500 to-forest-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <div className="max-w-4xl mx-auto">
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-12 pt-8 border-t border-white/10">
                <button
                  onClick={() => {
                    const currentIndex = steps.findIndex(s => s.id === currentStep);
                    if (currentIndex > 0) {
                      setCurrentStep(steps[currentIndex - 1].id);
                    }
                  }}
                  disabled={steps.findIndex(s => s.id === currentStep) === 0}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <button
                  onClick={() => {
                    const currentIndex = steps.findIndex(s => s.id === currentStep);
                    if (currentIndex < steps.length - 1) {
                      setCurrentStep(steps[currentIndex + 1].id);
                    }
                  }}
                  disabled={steps.findIndex(s => s.id === currentStep) === steps.length - 1}
                  className="px-6 py-3 bg-forest-500 hover:bg-forest-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>


      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={handlePaymentComplete}
        amount={getTotalCost()}
        contractType={contractConfig.type}
        treasuryAddress={treasuryAddress}
      />

      {/* Success Modal */}
      {deploymentResult && (
        <DeploymentSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setDeploymentResult(null);
          }}
          deploymentData={deploymentResult}
        />
      )}
    </div>
  );
}
