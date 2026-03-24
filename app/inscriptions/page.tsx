'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAccount, useWalletClient, usePublicClient, useSendTransaction, useWaitForTransaction } from 'wagmi';
import { parseEther, toHex } from 'viem';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnimatedBackground from '@/components/AnimatedBackground';

interface Inscription {
  txHash: string;
  from: string;
  dataUri: string;
  timestamp: number;
  blockNumber?: number;
  currentOwner?: string;
}

// Admin addresses
const ADMIN_ADDRESSES = [
  '0x36d7885524c591eda18Cf678b49a09772E89dB5c',
].map(addr => addr.toLowerCase());

// Inscription service fees
const INSCRIPTION_FEE_REGULAR = '6'; // XPL (regular users)
const INSCRIPTION_FEE_HOLDER = '3'; // XPL (Gen-Plasma holders - 50% off!)
const PAYMENT_ADDRESS = '0x36d7885524c591eda18Cf678b49a09772E89dB5c'; // Admin wallet for service fees

// Gen-Plasma NFT Contract (deployed contract address)
const GEN_PLASMA_CONTRACT = '0xB10d640B74016ed2b8E1f59CA931467D16534D08';
const GEN_PLASMA_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default function InscriptionsPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  
  // Mounted state for SSR
  const [mounted, setMounted] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'create' | 'explore' | 'my'>('create');
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [manualTxHash, setManualTxHash] = useState('');
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexResult, setIndexResult] = useState('');
  
  // Gen-Plasma holder discount
  const [isGenPlasmaHolder, setIsGenPlasmaHolder] = useState(false);
  const [isCheckingHolder, setIsCheckingHolder] = useState(false);
  
  // Payment flow state
  const [paymentPending, setPaymentPending] = useState(false);
  const [pendingInscriptionData, setPendingInscriptionData] = useState<string | null>(null);
  
  // Creation mode
  const [creationMode, setCreationMode] = useState<'pixel' | 'upload' | 'text'>('pixel');
  
  // Pixel board state
  const [pixelSize, setPixelSize] = useState(16); // 16x16, 24x24, 32x32
  const [pixelData, setPixelData] = useState<string[][]>([]);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Advanced color features
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientColor2, setGradientColor2] = useState('#FFFFFF');
  const [gradientType, setGradientType] = useState<'linear-h' | 'linear-v' | 'linear-d' | 'radial'>('linear-h');
  const [gradientMode, setGradientMode] = useState<'board' | 'pixel'>('board'); // Apply to entire board or per pixel
  const [selectedPixels, setSelectedPixels] = useState<Set<string>>(new Set()); // Selected pixels for per-pixel effects
  const [isSelecting, setIsSelecting] = useState(false); // Selection mode
  const [animationEffect, setAnimationEffect] = useState<'pulse' | 'strobe' | 'fade'>('pulse');
  const [animationSpeed, setAnimationSpeed] = useState(1000); // Animation speed in ms
  const [pixelAnimations, setPixelAnimations] = useState<Map<string, {effect: string, speed: number, color2: string}>>(new Map()); // Animation metadata per pixel
  
  // Metadata traits
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadata, setMetadata] = useState<Array<{trait: string, value: string}>>([]);
  const [currentTrait, setCurrentTrait] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  
  // Import flag to prevent useEffect from overwriting imported data
  const [isImporting, setIsImporting] = useState(false);
  
  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [optimizedImage, setOptimizedImage] = useState<string>('');
  
  // Text/JSON state
  const [textContent, setTextContent] = useState('');
  const [protocol, setProtocol] = useState<'text' | 'erc20' | 'nft' | 'custom'>('text');
  
  // Inscription state
  const [dataUri, setDataUri] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [inscriptionResult, setInscriptionResult] = useState<string>('');
  
  // Explorer state
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [isLoadingInscriptions, setIsLoadingInscriptions] = useState(false);
  
  // Transfer state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferInscription, setTransferInscription] = useState<Inscription | null>(null);
  const [transferRecipient, setTransferRecipient] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState('');
  
  // Transaction state - Payment
  const { data: paymentTxData, sendTransaction: sendPayment } = useSendTransaction();
  const { isLoading: isPaymentPending, isSuccess: isPaymentSuccess } = useWaitForTransaction({
    hash: paymentTxData?.hash,
  });

  // Transaction state - Inscription
  const { data: txData, sendTransaction } = useSendTransaction();
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransaction({
    hash: txData?.hash,
  });

  // Transaction state - Transfer (separate hook to avoid conflicts)
  const { data: transferTxData, sendTransaction: sendTransferTransaction } = useSendTransaction();
  const { isLoading: isTransferTxPending, isSuccess: isTransferTxSuccess } = useWaitForTransaction({
    hash: transferTxData?.hash,
  });

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is admin
  useEffect(() => {
    if (address) {
      setIsAdmin(ADMIN_ADDRESSES.includes(address.toLowerCase()));
    } else {
      setIsAdmin(false);
    }
  }, [address]);

  // Check if user owns Gen-Plasma NFT
  useEffect(() => {
    const checkGenPlasmaOwnership = async () => {
      if (!address || !publicClient) {
        setIsGenPlasmaHolder(false);
        return;
      }

      setIsCheckingHolder(true);
      try {
        const balance = await publicClient.readContract({
          address: GEN_PLASMA_CONTRACT as `0x${string}`,
          abi: GEN_PLASMA_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });

        const isHolder = balance > BigInt(0);
        setIsGenPlasmaHolder(isHolder);
        console.log(`🎨 Gen-Plasma holder check: ${isHolder ? 'YES ✅' : 'NO ❌'} (balance: ${balance.toString()})`);
      } catch (error: any) {
        // If contract read fails, assume not a holder (fail-safe to regular price)
        console.warn('⚠️ Could not verify Gen-Plasma ownership (assuming NO):', error.message || error);
        setIsGenPlasmaHolder(false);
      } finally {
        setIsCheckingHolder(false);
      }
    };

    checkGenPlasmaOwnership();
  }, [address, publicClient]);

  // Initialize pixel board
  useEffect(() => {
    if (mounted && !isImporting) {
      initializePixelBoard();
    }
  }, [pixelSize, mounted]);

  // Watch for payment success → automatically create inscription
  useEffect(() => {
    if (isPaymentSuccess && paymentTxData?.hash && pendingInscriptionData) {
      console.log('✅ Payment confirmed! Creating inscription automatically...');
      setInscriptionResult('✅ Payment confirmed! Creating inscription...');
      
      // Automatically send inscription transaction
      const nullAddress = '0x0000000000000000000000000000000000000000';
      sendTransaction({
        to: nullAddress as `0x${string}`,
        value: BigInt(0),
        data: pendingInscriptionData as `0x${string}`,
      });
      
      // Clear pending data
      setPendingInscriptionData(null);
      setPaymentPending(false);
    }
  }, [isPaymentSuccess, paymentTxData, pendingInscriptionData]);

  // Watch for inscription transaction success
  useEffect(() => {
    if (isTxSuccess && txData?.hash) {
      handleInscriptionSuccess(txData.hash);
    }
  }, [isTxSuccess, txData]);

  const handleInscriptionSuccess = async (txHash: string) => {
    setInscriptionResult(`✅ Inscription created! TX: ${txHash}`);
    
    // Save inscription to database
    try {
      const uri = generateDataUri();
      const response = await fetch('/api/inscriptions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionHash: txHash,
          fromAddress: address,
          dataUri: uri,
          blockNumber: null // Will be filled when block is mined
        })
      });

      if (response.ok) {
        console.log('✅ Inscription saved to database');
      } else {
        console.warn('⚠️ Failed to save inscription to database');
      }
    } catch (error) {
      console.error('❌ Error saving inscription:', error);
    }

    setIsCreating(false);
    
    // Clear the board/inputs
    if (creationMode === 'pixel') {
      initializePixelBoard();
    } else if (creationMode === 'upload') {
      setUploadedImage('');
      setOptimizedImage('');
    } else if (creationMode === 'text') {
      setTextContent('');
    }
    
    setDataUri('');
  };

  // Transfer inscription function
  const handleTransfer = async () => {
    if (!isConnected || !address) {
      setTransferResult('❌ Please connect your wallet');
      return;
    }

    if (!transferInscription) {
      setTransferResult('❌ No inscription selected');
      return;
    }

    if (!transferRecipient || !transferRecipient.startsWith('0x') || transferRecipient.length !== 42) {
      setTransferResult('❌ Invalid recipient address');
      return;
    }

    setIsTransferring(true);
    setTransferResult('⏳ Creating transfer transaction...');

    try {
      // Create transfer data compatible with Ethscriptions ESIP-1 protocol
      // Format: "plasma_inscription_transfer_<original_tx_hash>"
      const transferData = `plasma_inscription_transfer_${transferInscription.txHash}`;
      const hexData = toHex(transferData);

      console.log(`📤 Transferring inscription ${transferInscription.txHash} to ${transferRecipient}`);
      console.log(`📝 Transfer data:`, hexData);
      console.log(`💰 Value: 0 XPL (gas only)`);
      console.log(`🔍 sendTransferTransaction available:`, typeof sendTransferTransaction);

      if (!sendTransferTransaction) {
        throw new Error('Transaction function not available. Please refresh and try again.');
      }

      // MetaMask restriction: Cannot send data to any EOA (Externally Owned Account)
      // Solution: Always send to null address, recipient info is in data payload
      // This is the same pattern as Ethscriptions ESIP-1
      
      console.log('📝 Using null address pattern (ESIP-1 compatible)');
      const nullAddress = '0x0000000000000000000000000000000000000000';
      
      sendTransferTransaction({
        to: nullAddress as `0x${string}`,
        value: BigInt(0), // No value to null address
        data: hexData as `0x${string}`,
      });

      console.log('✅ Transaction request sent to MetaMask');

    } catch (error: any) {
      console.error('❌ Transfer error:', error);
      setTransferResult(`❌ Transfer failed: ${error.message || 'Unknown error'}`);
      setIsTransferring(false);
    }
  };

  // Handle transfer transaction success
  useEffect(() => {
    if (isTransferTxSuccess && transferTxData?.hash) {
      handleTransferSuccess(transferTxData.hash);
    }
  }, [isTransferTxSuccess, transferTxData]);

  const handleTransferSuccess = async (txHash: string) => {
    setTransferResult(`✅ Transfer transaction sent! TX: ${txHash}`);
    
    if (!transferInscription || !transferRecipient) return;

    // Record transfer in database
    try {
      const response = await fetch('/api/inscriptions/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inscriptionTxHash: transferInscription.txHash,
          fromAddress: address,
          toAddress: transferRecipient,
          transferTxHash: txHash,
          blockNumber: null // Will be filled when indexed
        })
      });

      if (response.ok) {
        console.log('✅ Transfer recorded in database');
        setTransferResult(`✅ Transfer complete! Inscription sent to ${transferRecipient.slice(0, 10)}...`);
        
        // Refresh inscriptions after 2 seconds
        setTimeout(() => {
          loadInscriptions();
          setShowTransferModal(false);
          setTransferInscription(null);
          setTransferRecipient('');
        }, 2000);
      } else {
        const error = await response.json();
        console.warn('⚠️ Failed to record transfer:', error);
        setTransferResult(`⚠️ Transfer sent but not recorded: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error recording transfer:', error);
      setTransferResult('⚠️ Transfer sent but database update failed');
    }

    setIsTransferring(false);
  };

  const initializePixelBoard = () => {
    const newBoard: string[][] = [];
    for (let i = 0; i < pixelSize; i++) {
      newBoard[i] = [];
      for (let j = 0; j < pixelSize; j++) {
        newBoard[i][j] = '#FFFFFF'; // White background
      }
    }
    setPixelData(newBoard);
    drawCanvas(newBoard);
  };

  const drawCanvas = (data: string[][], size?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentSize = size || pixelSize;
    const cellSize = canvas.width / currentSize;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid and pixels
    for (let i = 0; i < currentSize; i++) {
      for (let j = 0; j < currentSize; j++) {
        // Fill pixel
        ctx.fillStyle = data[i][j];
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        
        // Draw grid lines
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cellSize = canvas.width / pixelSize;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    
    if (row >= 0 && row < pixelSize && col >= 0 && col < pixelSize) {
      // Selection mode: toggle pixel selection
      if (isSelecting) {
        const pixelKey = `${row},${col}`;
        const newSelection = new Set(selectedPixels);
        if (newSelection.has(pixelKey)) {
          newSelection.delete(pixelKey);
        } else {
          newSelection.add(pixelKey);
        }
        setSelectedPixels(newSelection);
        
        // Redraw canvas with selection overlay
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawCanvas(pixelData);
          // Draw selection overlay
          newSelection.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.3)'; // Purple overlay
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#6366F1';
            ctx.lineWidth = 2;
            ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
          });
        }
      } else {
        // Drawing mode: paint pixel
        const newData = [...pixelData];
        newData[row][col] = currentColor;
        setPixelData(newData);
        drawCanvas(newData);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    handleCanvasClick(e);
  };

  // Helper function to compress hex color codes
  const compressColor = (color: string): string => {
    // Try to convert to 3-digit hex if possible
    if (color.length === 7 && color[0] === '#') {
      if (color[1] === color[2] && color[3] === color[4] && color[5] === color[6]) {
        return `#${color[1]}${color[3]}${color[5]}`;
      }
    }
    return color.toLowerCase();
  };

  const pixelBoardToSVG = (): string => {
    // Safety check for SSR
    if (!pixelData || pixelData.length === 0) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"></svg>';
    }
    
    const cellSize = 10; // 10px per cell in final SVG
    const svgSize = pixelSize * cellSize;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}">`;
    
    // Optimization: Group consecutive pixels of same color in rows
    for (let i = 0; i < pixelSize; i++) {
      let j = 0;
      while (j < pixelSize) {
        if (pixelData[i] && pixelData[i][j] && pixelData[i][j] !== '#FFFFFF') {
          const pixelKey = `${i},${j}`;
          const animation = pixelAnimations.get(pixelKey);
          const baseColor = compressColor(pixelData[i][j]);
          
          // Check if this pixel has animation - if so, can't compress
          if (animation) {
            const targetColor = compressColor(animation.color2);
            const dur = `${animation.speed / 1000}s`;
            
            svg += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="${baseColor}">`;
            
            if (animation.effect === 'pulse') {
              svg += `<animate attributeName="fill" values="${baseColor};${targetColor};${baseColor}" dur="${dur}" repeatCount="indefinite"/>`;
            } else if (animation.effect === 'strobe') {
              svg += `<animate attributeName="fill" values="${baseColor};${targetColor}" dur="${dur}" repeatCount="indefinite"/>`;
            } else if (animation.effect === 'fade') {
              svg += `<animate attributeName="opacity" values="1;0;1" dur="${dur}" repeatCount="indefinite"/>`;
            }
            
            svg += `</rect>`;
            j++;
          } else {
            // Static pixel: check if we can compress consecutive same-color pixels
            let width = 1;
            while (
              j + width < pixelSize &&
              pixelData[i][j + width] === pixelData[i][j] &&
              !pixelAnimations.has(`${i},${j + width}`)
            ) {
              width++;
            }
            
            // Render compressed rect
            if (width === 1) {
              svg += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="${baseColor}"/>`;
            } else {
              svg += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${width * cellSize}" height="${cellSize}" fill="${baseColor}"/>`;
            }
            
            j += width;
          }
        } else {
          j++;
        }
      }
    }
    
    svg += '</svg>';
    return svg;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize to reasonable size (max 256x256 - good balance of quality/size)
        const maxSize = 256;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Get optimized data URL with quality setting
        // Use JPEG for photos (smaller), PNG for graphics/transparency
        const fileType = file.type;
        let optimized: string;
        
        if (fileType.includes('png') || fileType.includes('gif')) {
          // PNG for graphics/transparency - smaller file with fewer colors
          optimized = canvas.toDataURL('image/png');
        } else {
          // JPEG with 85% quality for photos - much smaller
          optimized = canvas.toDataURL('image/jpeg', 0.85);
        }
        
        setOptimizedImage(optimized);
        setUploadedImage(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const generateDataUri = () => {
    let data = '';
    
    if (creationMode === 'pixel') {
      const svg = pixelBoardToSVG();
      data = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    } else if (creationMode === 'upload') {
      data = optimizedImage;
    } else if (creationMode === 'text') {
      if (protocol === 'text') {
        data = `data:text/plain,${encodeURIComponent(textContent)}`;
      } else {
        // JSON protocols
        data = `data:,${textContent}`;
      }
    }
    
    setDataUri(data);
    return data;
  };

  // Get current inscription fee based on user status
  const getCurrentFee = () => {
    if (isAdmin) return '0';
    return isGenPlasmaHolder ? INSCRIPTION_FEE_HOLDER : INSCRIPTION_FEE_REGULAR;
  };

  const handleInscribe = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet');
      return;
    }

    const uri = generateDataUri();
    
    if (!uri) {
      alert('Please create content to inscribe');
      return;
    }

    // Check size (96KB is the practical soft limit for calldata)
    const sizeInBytes = new Blob([uri]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    
    if (sizeInBytes > 98304) { // 96KB = 98304 bytes
      if (!confirm(`Warning: Your inscription is ${sizeInKB}KB. The recommended limit is ~96KB. Large inscriptions may fail or cost significantly more gas. Continue?`)) {
        return;
      }
    } else if (sizeInBytes > 51200) { // 50KB warning
      if (!confirm(`Your inscription is ${sizeInKB}KB. This will cost more gas than smaller inscriptions. Continue?`)) {
        return;
      }
    }

    setIsCreating(true);
    setInscriptionResult('');

    try {
      // Encode inscription data as hex
      const hexData = toHex(uri);
      
      // Determine fee based on status
      const inscriptionFee = isAdmin 
        ? '0'  // Free for admins
        : isGenPlasmaHolder 
          ? INSCRIPTION_FEE_HOLDER  // 3 XPL for Gen-Plasma holders (50% off!)
          : INSCRIPTION_FEE_REGULAR; // 6 XPL for regular users
      
      console.log(`📝 Creating inscription: ${
        isAdmin ? 'FREE (admin)' : 
        isGenPlasmaHolder ? `${inscriptionFee} XPL (Gen-Plasma holder 50% off!)` : 
        `${inscriptionFee} XPL`
      }`);
      console.log(`📦 Data size: ${sizeInKB} KB`);
      
      // For non-admins: TWO TRANSACTIONS (automated)
      // 1. Payment to admin wallet
      // 2. Inscription to null address (automatic after payment confirms)
      if (!isAdmin && parseFloat(inscriptionFee) > 0) {
        console.log(`💰 Step 1/2: Sending payment ${inscriptionFee} XPL to ${PAYMENT_ADDRESS}`);
        setInscriptionResult(`⏳ Step 1/2: Confirm payment in wallet...`);
        
        // Store inscription data for automatic creation after payment
        setPendingInscriptionData(hexData);
        setPaymentPending(true);
        
        // Send payment transaction
        sendPayment({
          to: PAYMENT_ADDRESS as `0x${string}`,
          value: BigInt(parseFloat(inscriptionFee) * 10**18),
        });
        
        return; // Exit - inscription will be created automatically after payment confirms
      }
      
      // For admins: Direct inscription (free)
      console.log(`📝 Creating free inscription (admin)`);
      const nullAddress = '0x0000000000000000000000000000000000000000';
      
      sendTransaction({
        to: nullAddress as `0x${string}`,
        value: BigInt(0),
        data: hexData as `0x${string}`,
      });
      
    } catch (error: any) {
      console.error('Inscription error:', error);
      setInscriptionResult(`❌ Error: ${error.message}`);
      setIsCreating(false);
    }
  };

  const loadInscriptions = async () => {
    setIsLoadingInscriptions(true);
    try {
      const response = await fetch('/api/inscriptions/list');
      if (response.ok) {
        const data = await response.json();
        setInscriptions(data.inscriptions || []);
      }
    } catch (error) {
      console.error('Error loading inscriptions:', error);
    } finally {
      setIsLoadingInscriptions(false);
    }
  };

  const loadMyInscriptions = async () => {
    if (!address) return;
    setIsLoadingInscriptions(true);
    try {
      const response = await fetch(`/api/inscriptions/list?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setInscriptions(data.inscriptions || []);
      }
    } catch (error) {
      console.error('Error loading my inscriptions:', error);
    } finally {
      setIsLoadingInscriptions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'explore') {
      loadInscriptions();
    } else if (activeTab === 'my') {
      loadMyInscriptions();
    }
  }, [activeTab, address]);

  const clearBoard = () => {
    initializePixelBoard();
  };

  const fillBoard = () => {
    const newData = pixelData.map(row => row.map(() => currentColor));
    setPixelData(newData);
    drawCanvas(newData);
  };

  // Apply gradient to board
  const applyGradient = () => {
    const newData = [...pixelData];
    
    if (gradientMode === 'board') {
      // Apply gradient across entire board
      for (let y = 0; y < pixelSize; y++) {
        for (let x = 0; x < pixelSize; x++) {
          let t = 0; // interpolation factor (0 to 1)
          
          switch (gradientType) {
            case 'linear-h': // Horizontal
              t = x / (pixelSize - 1);
              break;
            case 'linear-v': // Vertical
              t = y / (pixelSize - 1);
              break;
            case 'linear-d': // Diagonal
              t = (x + y) / ((pixelSize - 1) * 2);
              break;
            case 'radial': // Radial from center
              const centerX = (pixelSize - 1) / 2;
              const centerY = (pixelSize - 1) / 2;
              const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
              const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
              t = Math.min(dist / maxDist, 1);
              break;
          }
          
          // Interpolate between color1 and color2
          const color1 = hexToRgb(currentColor);
          const color2 = hexToRgb(gradientColor2);
          
          const r = Math.round(color1.r + (color2.r - color1.r) * t);
          const g = Math.round(color1.g + (color2.g - color1.g) * t);
          const b = Math.round(color1.b + (color2.b - color1.b) * t);
          
          newData[y][x] = rgbToHex(r, g, b);
        }
      }
    } else {
      // Apply gradient per-pixel (micro gradients to selected pixels only)
      if (selectedPixels.size === 0) {
        alert('⚠️ Please select pixels first (click "Select Pixels" button)');
        return;
      }
      
      selectedPixels.forEach(pixelKey => {
        const [y, x] = pixelKey.split(',').map(Number);
        
        // Create random variation per pixel
        const t = Math.random();
        
        // Interpolate between color1 and color2
        const color1 = hexToRgb(currentColor);
        const color2 = hexToRgb(gradientColor2);
        
        const r = Math.round(color1.r + (color2.r - color1.r) * t);
        const g = Math.round(color1.g + (color2.g - color1.g) * t);
        const b = Math.round(color1.b + (color2.b - color1.b) * t);
        
        newData[y][x] = rgbToHex(r, g, b);
      });
    }
    
    setPixelData(newData);
    drawCanvas(newData);
  };

  // Apply animation effect (note: effects are visual representations, actual SVG is static)
  const applyAnimationEffect = () => {
    if (selectedPixels.size === 0) {
      alert('⚠️ Please select pixels first (click "Select" button)');
      return;
    }
    
    const newAnimations = new Map(pixelAnimations);
    
    selectedPixels.forEach(pixelKey => {
      const [y, x] = pixelKey.split(',').map(Number);
      const currentPixelColor = pixelData[y][x];
      
      // Store animation metadata for this pixel
      newAnimations.set(pixelKey, {
        effect: animationEffect,
        speed: animationSpeed,
        color2: gradientColor2 // Use second color for animation target
      });
    });
    
    setPixelAnimations(newAnimations);
    console.log(`✨ Applied ${animationEffect} animation to ${selectedPixels.size} pixels (speed: ${animationSpeed}ms)`);
    alert(`✅ Animation applied to ${selectedPixels.size} pixel${selectedPixels.size !== 1 ? 's' : ''}!\nCheck the SVG preview to see it in action.`);
  };

  // Metadata functions
  const addMetadataTrait = () => {
    if (!currentTrait.trim() || !currentValue.trim()) {
      alert('⚠️ Please enter both trait and value');
      return;
    }
    
    setMetadata([...metadata, { trait: currentTrait.trim(), value: currentValue.trim() }]);
    setCurrentTrait('');
    setCurrentValue('');
  };

  const removeMetadataTrait = (index: number) => {
    setMetadata(metadata.filter((_, i) => i !== index));
  };

  // Import/Export functions
  const exportBoard = () => {
    const boardData = {
      pixelData,
      pixelSize,
      pixelAnimations: Array.from(pixelAnimations.entries()),
      metadata,
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(boardData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pixel-art-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('📤 Board exported successfully');
  };

  const importBoard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        
        // Check if it's an SVG file
        if (file.name.endsWith('.svg') || content.trim().startsWith('<svg')) {
          console.log('📥 Importing SVG file...');
          
          // Parse SVG to extract pixel data
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(content, 'image/svg+xml');
          const svgElement = svgDoc.querySelector('svg');
          
          if (!svgElement) {
            alert('❌ Invalid SVG file');
            return;
          }
          
          const rects = svgElement.querySelectorAll('rect');
          if (rects.length === 0) {
            alert('❌ No pixel data found in SVG');
            return;
          }
          
          // Determine board size from SVG dimensions
          const svgWidth = parseInt(svgElement.getAttribute('width') || '160');
          const cellSize = 10; // Standard cell size
          const newPixelSize = svgWidth / cellSize;
          
          // Initialize empty board
          const newData: string[][] = Array(newPixelSize).fill(null).map(() => 
            Array(newPixelSize).fill('#FFFFFF')
          );
          
          // Extract pixel colors and animations from SVG rects
          const newAnimations = new Map<string, {effect: string, speed: number, color2: string}>();
          
          rects.forEach(rect => {
            const x = Math.floor(parseInt(rect.getAttribute('x') || '0') / cellSize);
            const y = Math.floor(parseInt(rect.getAttribute('y') || '0') / cellSize);
            const fill = rect.getAttribute('fill') || '#000000';
            
            if (x < newPixelSize && y < newPixelSize) {
              newData[y][x] = fill;
              
              // Check for animations
              const animateElement = rect.querySelector('animate');
              if (animateElement) {
                const attributeName = animateElement.getAttribute('attributeName');
                const values = animateElement.getAttribute('values') || '';
                const dur = animateElement.getAttribute('dur') || '1s';
                const speed = parseFloat(dur) * 1000; // Convert to ms
                
                let effect = 'pulse';
                let color2 = fill;
                
                if (attributeName === 'opacity') {
                  effect = 'fade';
                } else if (attributeName === 'fill') {
                  const colors = values.split(';');
                  if (colors.length === 2) {
                    effect = 'strobe';
                    color2 = colors[1];
                  } else if (colors.length === 3) {
                    effect = 'pulse';
                    color2 = colors[1];
                  }
                }
                
                const pixelKey = `${y},${x}`;
                newAnimations.set(pixelKey, { effect, speed, color2 });
              }
            }
          });
          
          // Update state and draw canvas with new size
          setIsImporting(true);
          setPixelSize(newPixelSize);
          setPixelData(newData);
          setPixelAnimations(newAnimations);
          
          // Use setTimeout to ensure canvas is ready with new size
          setTimeout(() => {
            drawCanvas(newData, newPixelSize);
            setIsImporting(false);
          }, 150);
          
          console.log(`📥 SVG imported: ${newPixelSize}x${newPixelSize}, ${rects.length} pixels, ${newAnimations.size} animations`);
          alert(`✅ SVG imported successfully!\n${newPixelSize}x${newPixelSize} board with ${newAnimations.size} animations`);
          
        } else {
          // Try parsing as JSON
          const boardData = JSON.parse(content);
          
          if (!boardData.pixelData || !boardData.pixelSize) {
            alert('❌ Invalid board file format');
            return;
          }
          
          // Update state
          setIsImporting(true);
          setPixelSize(boardData.pixelSize);
          setPixelData(boardData.pixelData);
          
          if (boardData.pixelAnimations) {
            setPixelAnimations(new Map(boardData.pixelAnimations));
          }
          
          if (boardData.metadata) {
            setMetadata(boardData.metadata);
          }
          
          // Use setTimeout to ensure canvas is ready with new size
          setTimeout(() => {
            drawCanvas(boardData.pixelData, boardData.pixelSize);
            setIsImporting(false);
          }, 150);
          
          console.log('📥 JSON board imported successfully');
          alert('✅ Board imported successfully!');
        }
      } catch (error) {
        console.error('❌ Import error:', error);
        alert('❌ Failed to import file. Please check the file format (JSON or SVG supported).');
      }
    };
    
    reader.readAsText(file);
  };

  // Legacy dithering function - simplified Bayer dithering only
  const applyDithering = () => {
    const newData = [...pixelData];
    
    // Bayer matrix (4x4)
    const bayerMatrix = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5]
    ];
    
    for (let y = 0; y < pixelSize; y++) {
      for (let x = 0; x < pixelSize; x++) {
        const threshold = bayerMatrix[y % 4][x % 4] / 16;
        const color = hexToRgb(newData[y][x]);
        const brightness = (color.r + color.g + color.b) / (3 * 255);
        
        const newColor = brightness > threshold ? '#FFFFFF' : currentColor;
        newData[y][x] = newColor;
      }
    }
    
    setPixelData(newData);
    drawCanvas(newData);
  };

  // Helper functions for color conversion
  const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const handleManualIndex = async () => {
    if (!manualTxHash || !manualTxHash.startsWith('0x')) {
      setIndexResult('❌ Please enter a valid transaction hash (starts with 0x)');
      return;
    }

    setIsIndexing(true);
    setIndexResult('🔍 Fetching transaction data...');

    try {
      // Fetch transaction from blockchain
      const tx = await publicClient.getTransaction({
        hash: manualTxHash as `0x${string}`
      });

      if (!tx) {
        setIndexResult('❌ Transaction not found');
        setIsIndexing(false);
        return;
      }

      // Check if transaction has data (calldata)
      if (!tx.input || tx.input === '0x') {
        setIndexResult('❌ Transaction has no inscription data');
        setIsIndexing(false);
        return;
      }

      setIndexResult('📝 Decoding inscription data...');

      // Decode hex data to string
      let dataUri = '';
      try {
        // Remove 0x prefix and convert hex to string
        const hexData = tx.input.slice(2);
        const bytes = new Uint8Array(hexData.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        dataUri = new TextDecoder().decode(bytes);
      } catch (error) {
        setIndexResult('❌ Failed to decode inscription data');
        setIsIndexing(false);
        return;
      }

      // Validate it's a data URI
      if (!dataUri.startsWith('data:')) {
        setIndexResult('❌ Transaction data is not a valid inscription (must start with "data:")');
        setIsIndexing(false);
        return;
      }

      // Check if this is a transfer transaction (should not be indexed as inscription)
      if (dataUri.includes('plasma_inscription_transfer_')) {
        setIndexResult('❌ This is a transfer transaction, not an inscription. Transfers are automatically tracked.');
        setIsIndexing(false);
        return;
      }

      setIndexResult('💾 Saving inscription to database...');

      // Save to database
      const response = await fetch('/api/inscriptions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionHash: tx.hash,
          fromAddress: tx.from,
          dataUri: dataUri,
          blockNumber: tx.blockNumber ? Number(tx.blockNumber) : null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.duplicate) {
          setIndexResult('ℹ️ Inscription already indexed!');
        } else {
          setIndexResult(`❌ Failed to save: ${error.error}`);
        }
        setIsIndexing(false);
        return;
      }

      setIndexResult('✅ Inscription indexed successfully!');
      setManualTxHash('');
      
      // Reload inscriptions if on explore tab
      if (activeTab === 'explore') {
        setTimeout(() => loadInscriptions(), 1000);
      }
    } catch (error: any) {
      console.error('Manual index error:', error);
      setIndexResult(`❌ Error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsIndexing(false);
    }
  };

  // Memoize size calculation to prevent re-render loops
  const sizeInfo = useMemo(() => {
    try {
      const uri = generateDataUri();
      if (!uri) return null;
      
      const sizeInBytes = new Blob([uri]).size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      const isOverLimit = sizeInBytes > 98304; // 96KB
      const isWarning = sizeInBytes > 51200; // 50KB
      
      return { sizeInBytes, sizeInKB, isOverLimit, isWarning };
    } catch (error) {
      console.error('Size calculation error:', error);
      return null;
    }
  }, [pixelData, pixelAnimations, creationMode, uploadedImage, optimizedImage, textContent, protocol]);

  // Don't render until mounted (prevent SSR issues)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
        <Header />
        <main className="container mx-auto px-6 py-12 relative z-10">
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-400">Loading Inscriptions...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      <AnimatedBackground />
      <Header />
      
      <main className="container mx-auto px-6 py-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 text-transparent bg-clip-text">
              Plasma Inscriptions
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Create permanent, on-chain inscriptions on Plasma. Draw pixel art, upload tiny images, or inscribe text - all stored forever in transaction data.
          </p>
          <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Pure On-Chain</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>No Contracts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Minimal Gas</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white/5 rounded-lg p-1 backdrop-blur-sm border border-white/10">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'create'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Create Inscription
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'explore'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'my'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              My Inscriptions
            </button>
          </div>
        </div>

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="max-w-5xl mx-auto">
            {/* Creation Mode Selector */}
            <div className="glass-card p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-4">Choose Creation Mode</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => setCreationMode('pixel')}
                  className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                    creationMode === 'pixel'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <div className="text-4xl mb-2">🎨</div>
                  <div className="font-bold text-white mb-1">Pixel Board</div>
                  <div className="text-sm text-gray-400">Draw pixel art</div>
                </button>
                
                <button
                  onClick={() => setCreationMode('upload')}
                  className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                    creationMode === 'upload'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <div className="text-4xl mb-2">📤</div>
                  <div className="font-bold text-white mb-1">Upload Image</div>
                  <div className="text-sm text-gray-400">Auto-optimized</div>
                </button>
                
                <button
                  onClick={() => setCreationMode('text')}
                  className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                    creationMode === 'text'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <div className="text-4xl mb-2">📝</div>
                  <div className="font-bold text-white mb-1">Text/JSON</div>
                  <div className="text-sm text-gray-400">Messages & data</div>
                </button>
              </div>
            </div>

            {/* Pixel Board Mode */}
            {creationMode === 'pixel' && (
              <div className="glass-card p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Canvas */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Pixel Board</h3>
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={400}
                        onClick={handleCanvasClick}
                        onMouseDown={() => setIsDrawing(true)}
                        onMouseUp={() => setIsDrawing(false)}
                        onMouseLeave={() => setIsDrawing(false)}
                        onMouseMove={handleCanvasMouseMove}
                        className="cursor-crosshair border border-gray-300"
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Controls</h3>
                    
                    {/* Size Selector */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Board Size
                      </label>
                      <div className="flex space-x-2">
                        {[16, 24, 32].map(size => (
                          <button
                            key={size}
                            onClick={() => setPixelSize(size)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              pixelSize === size
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            }`}
                          >
                            {size}x{size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Picker */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={currentColor}
                          onChange={(e) => setCurrentColor(e.target.value)}
                          className="w-16 h-16 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={currentColor}
                          onChange={(e) => setCurrentColor(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    {/* Quick Colors */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quick Colors
                      </label>
                      <div className="grid grid-cols-8 gap-2">
                        {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
                          '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#4B0082', '#00CED1'].map(color => (
                          <button
                            key={color}
                            onClick={() => setCurrentColor(color)}
                            className="w-8 h-8 rounded border-2 border-white/20 hover:border-white/40 transition-all"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 mb-6">
                      <button
                        onClick={clearBoard}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
                      >
                        Clear
                      </button>
                      <button
                        onClick={fillBoard}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
                      >
                        Fill
                      </button>
                      <button
                        onClick={() => {
                          setIsSelecting(!isSelecting);
                          if (isSelecting) {
                            setSelectedPixels(new Set());
                          }
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                          isSelecting 
                            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                        }`}
                      >
                        {isSelecting ? '✓ Selecting' : 'Select'}
                      </button>
                      {selectedPixels.size > 0 && (
                        <button
                          onClick={() => setSelectedPixels(new Set())}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
                          title={`Clear ${selectedPixels.size} selected pixels`}
                        >
                          Clear ({selectedPixels.size})
                        </button>
                      )}
                    </div>

                    {/* Preview */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        SVG Preview (Actual Size)
                      </label>
                      <div 
                        className="bg-white/10 p-4 rounded-lg"
                        dangerouslySetInnerHTML={{ __html: pixelBoardToSVG() }}
                      />
                    </div>

                    {/* Import/Export Buttons */}
                    <div className="flex space-x-2 mb-4">
                      <button
                        onClick={exportBoard}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Board
                      </button>
                      <label className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import Board
                        <input
                          type="file"
                          accept=".json,.svg"
                          onChange={importBoard}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Metadata Section */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={() => setShowMetadata(!showMetadata)}
                    className="flex items-center justify-between w-full text-left mb-4"
                  >
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Metadata Traits
                    </h3>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform ${showMetadata ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showMetadata && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-400">
                        Add custom traits and attributes to your inscription (e.g., "Background": "Gradient", "Style": "Retro")
                      </p>

                      {/* Add Trait Form */}
                      <div className="glass-card p-4 border border-cyan-500/30">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Trait Type
                            </label>
                            <input
                              type="text"
                              value={currentTrait}
                              onChange={(e) => setCurrentTrait(e.target.value)}
                              placeholder="e.g., Background"
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              onKeyPress={(e) => e.key === 'Enter' && addMetadataTrait()}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Value
                            </label>
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => setCurrentValue(e.target.value)}
                              placeholder="e.g., Gradient"
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              onKeyPress={(e) => e.key === 'Enter' && addMetadataTrait()}
                            />
                          </div>
                        </div>
                        <button
                          onClick={addMetadataTrait}
                          className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-all"
                        >
                          Add Trait
                        </button>
                      </div>

                      {/* Traits List */}
                      {metadata.length > 0 && (
                        <div className="glass-card p-4 border border-cyan-500/20">
                          <h4 className="text-sm font-semibold text-white mb-3">Current Traits ({metadata.length})</h4>
                          <div className="space-y-2">
                            {metadata.map((trait, index) => (
                              <div 
                                key={index}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                              >
                                <div className="flex-1">
                                  <span className="text-cyan-400 font-medium">{trait.trait}:</span>
                                  <span className="text-white ml-2">{trait.value}</span>
                                </div>
                                <button
                                  onClick={() => removeMetadataTrait(index)}
                                  className="ml-3 p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all"
                                  title="Remove trait"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Advanced Features Section */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full text-left mb-4"
                  >
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      Advanced Effects
                    </h3>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showAdvanced && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Gradient Section */}
                      <div className="glass-card p-4 border border-purple-500/30">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-white flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            Multi-Color Gradients
                          </h4>
                        </div>

                        {/* Application Mode Toggle */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Application Mode
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setGradientMode('board')}
                              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                gradientMode === 'board'
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              📐 Entire Board
                            </button>
                            <button
                              onClick={() => setGradientMode('pixel')}
                              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                gradientMode === 'pixel'
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              🎲 Per Pixel
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {gradientMode === 'board' ? '📐 Smooth gradient across entire canvas' : '🎲 Random color variation per pixel'}
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          {/* Color 1 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Color 1 (Start)
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={currentColor}
                                onChange={(e) => setCurrentColor(e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer"
                              />
                              <input
                                type="text"
                                value={currentColor}
                                onChange={(e) => setCurrentColor(e.target.value)}
                                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                              />
                            </div>
                          </div>

                          {/* Color 2 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Color 2 (End)
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={gradientColor2}
                                onChange={(e) => setGradientColor2(e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer"
                              />
                              <input
                                type="text"
                                value={gradientColor2}
                                onChange={(e) => setGradientColor2(e.target.value)}
                                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Gradient Type */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Gradient Direction
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setGradientType('linear-h')}
                              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                gradientType === 'linear-h'
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              Horizontal →
                            </button>
                            <button
                              onClick={() => setGradientType('linear-v')}
                              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                gradientType === 'linear-v'
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              Vertical ↓
                            </button>
                            <button
                              onClick={() => setGradientType('linear-d')}
                              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                gradientType === 'linear-d'
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              Diagonal ↘
                            </button>
                            <button
                              onClick={() => setGradientType('radial')}
                              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                gradientType === 'radial'
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              Radial ◉
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={applyGradient}
                          className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all"
                        >
                          Apply Gradient
                        </button>
                      </div>

                      {/* Animation Effects Section */}
                      <div className="glass-card p-4 border border-pink-500/30">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-white flex items-center gap-2">
                            <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Animation Effects
                          </h4>
                          <span className="text-xs text-gray-500">Per-pixel animations</span>
                        </div>

                        {/* Info Box */}
                        {selectedPixels.size === 0 && (
                          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-xs text-yellow-300">
                              💡 Select pixels first to apply animation effects
                            </p>
                          </div>
                        )}

                        {selectedPixels.size > 0 && (
                          <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                            <p className="text-xs text-purple-300">
                              ✨ {selectedPixels.size} pixel{selectedPixels.size !== 1 ? 's' : ''} selected
                            </p>
                          </div>
                        )}

                        {/* Animation Effect Type */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Effect Type
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => setAnimationEffect('pulse')}
                              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                animationEffect === 'pulse'
                                  ? 'bg-pink-500 text-white'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              💓 Pulse
                            </button>
                            <button
                              onClick={() => setAnimationEffect('strobe')}
                              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                animationEffect === 'strobe'
                                  ? 'bg-pink-500 text-white'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              ⚡ Strobe
                            </button>
                            <button
                              onClick={() => setAnimationEffect('fade')}
                              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                animationEffect === 'fade'
                                  ? 'bg-pink-500 text-white'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              🌙 Fade
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {animationEffect === 'pulse' && '💓 Smooth breathing effect - Colors brighten and dim'}
                            {animationEffect === 'strobe' && '⚡ Rapid on/off flashing - High energy effect'}
                            {animationEffect === 'fade' && '🌙 Gradual fade in/out - Gentle transition'}
                          </p>
                        </div>

                        {/* Animation Speed */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Animation Speed: {animationSpeed}ms
                          </label>
                          <input
                            type="range"
                            min="100"
                            max="2000"
                            step="100"
                            value={animationSpeed}
                            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Fast (100ms)</span>
                            <span>Slow (2000ms)</span>
                          </div>
                        </div>

                        {/* Apply Button */}
                        <button
                          onClick={applyAnimationEffect}
                          disabled={selectedPixels.size === 0}
                          className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                            selectedPixels.size === 0
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-pink-500 hover:bg-pink-600 text-white'
                          }`}
                        >
                          {selectedPixels.size === 0 
                            ? 'Select Pixels First' 
                            : `Apply ${animationEffect.charAt(0).toUpperCase() + animationEffect.slice(1)} Effect`
                          }
                        </button>

                        <p className="text-xs text-gray-500 mt-2 text-center">
                          ⚠️ Animation metadata will be embedded in SVG
                        </p>
                      </div>

                      {/* Preset Gradients */}
                      <div className="glass-card p-4 border border-orange-500/30">
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          Quick Presets
                        </h4>
                        <div className="grid grid-cols-4 gap-2">
                          <button
                            onClick={() => {
                              setCurrentColor('#FF6B6B');
                              setGradientColor2('#4ECDC4');
                              setGradientType('linear-h');
                            }}
                            className="aspect-square rounded-lg bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] hover:scale-105 transition-transform"
                            title="Sunset"
                          />
                          <button
                            onClick={() => {
                              setCurrentColor('#667eea');
                              setGradientColor2('#764ba2');
                              setGradientType('radial');
                            }}
                            className="aspect-square rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] hover:scale-105 transition-transform"
                            title="Purple Dream"
                          />
                          <button
                            onClick={() => {
                              setCurrentColor('#f093fb');
                              setGradientColor2('#f5576c');
                              setGradientType('linear-v');
                            }}
                            className="aspect-square rounded-lg bg-gradient-to-b from-[#f093fb] to-[#f5576c] hover:scale-105 transition-transform"
                            title="Pink Bliss"
                          />
                          <button
                            onClick={() => {
                              setCurrentColor('#4facfe');
                              setGradientColor2('#00f2fe');
                              setGradientType('linear-d');
                            }}
                            className="aspect-square rounded-lg bg-gradient-to-br from-[#4facfe] to-[#00f2fe] hover:scale-105 transition-transform"
                            title="Ocean Blue"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Inscribe Button */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  {/* Size Display */}
                  {sizeInfo && (
                    <div className={`mb-4 p-4 border rounded-lg ${
                      sizeInfo.isOverLimit 
                        ? 'bg-red-500/10 border-red-500/30' 
                        : sizeInfo.isWarning 
                          ? 'bg-yellow-500/10 border-yellow-500/30'
                          : 'bg-green-500/10 border-green-500/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium ${
                            sizeInfo.isOverLimit ? 'text-red-300' : sizeInfo.isWarning ? 'text-yellow-300' : 'text-green-300'
                          }`}>
                            {sizeInfo.isOverLimit ? '⚠️ Inscription Size: TOO LARGE' : 
                             sizeInfo.isWarning ? '⚠️ Inscription Size: Warning' : 
                             '✅ Inscription Size: OK'}
                          </p>
                          <p className="text-sm text-gray-400">
                            {sizeInfo.isOverLimit 
                              ? 'Exceeds 96KB limit - will likely fail or cost extreme gas'
                              : sizeInfo.isWarning 
                                ? 'Over 50KB - will cost more gas than smaller inscriptions'
                                : 'Within optimal size range'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            sizeInfo.isOverLimit ? 'text-red-400' : sizeInfo.isWarning ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {sizeInfo.sizeInKB} KB
                          </p>
                          <p className="text-xs text-gray-500">
                            {sizeInfo.sizeInBytes.toLocaleString()} bytes
                          </p>
                        </div>
                      </div>
                      {sizeInfo.isOverLimit && (
                        <p className="mt-2 text-xs text-red-400">
                          💡 Tip: Use fewer colors, remove animations, or create a smaller board to reduce size
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Service Fee Info */}
                  {!isAdmin && (
                    <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Inscription Service Fee</p>
                          <p className="text-sm text-gray-400">Two transactions: payment first, then auto-inscription!</p>
                          {isGenPlasmaHolder && (
                            <div className="mt-2 inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-lg px-3 py-1">
                              <span className="text-sm font-medium text-purple-300">Gen-Plasma Holder: 50% OFF!</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          {isGenPlasmaHolder ? (
                            <>
                              <p className="text-sm text-gray-500 line-through">{INSCRIPTION_FEE_REGULAR} XPL</p>
                              <p className="text-2xl font-bold text-green-400">{INSCRIPTION_FEE_HOLDER} XPL</p>
                              <p className="text-xs text-green-500">Save {(parseFloat(INSCRIPTION_FEE_REGULAR) - parseFloat(INSCRIPTION_FEE_HOLDER)).toFixed(2)} XPL!</p>
                            </>
                          ) : (
                            <>
                              <p className="text-2xl font-bold text-purple-400">{INSCRIPTION_FEE_REGULAR} XPL</p>
                              <p className="text-xs text-gray-500">+ network gas</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                      <p className="text-green-300 text-sm">
                        👑 <strong>Admin:</strong> Free inscriptions (no service fee)
                      </p>
                    </div>
                  )}

                  {/* Single Inscribe Button */}
                  <button
                    onClick={handleInscribe}
                    disabled={isCreating || isTxPending || isPaymentPending || !isConnected}
                    className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all shadow-lg"
                  >
                    {!isConnected ? 'Connect Wallet to Inscribe' :
                     isPaymentPending ? '⏳ Processing Payment...' :
                     isCreating || isTxPending ? '⏳ Creating Inscription...' : 
                     isAdmin ? '🔥 Inscribe to Plasma (Free)' :
                     `🔥 Inscribe to Plasma (${getCurrentFee()} XPL)`}
                  </button>
                  
                  {inscriptionResult && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      inscriptionResult.includes('✅') 
                        ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                        : 'bg-red-500/20 border border-red-500/50 text-red-300'
                    }`}>
                      {inscriptionResult}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Image Upload Mode */}
            {creationMode === 'upload' && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4">Upload & Optimize Image</h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Image (will be optimized to max 256x256px)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    💡 JPEG for photos (smaller), PNG for graphics with transparency
                  </p>
                </div>

                {optimizedImage && (
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Original</h4>
                      <div className="bg-white/10 p-4 rounded-lg">
                        <img src={uploadedImage} alt="Original" className="max-w-full" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Optimized (for inscription)</h4>
                      <div className="bg-white/10 p-4 rounded-lg">
                        <img src={optimizedImage} alt="Optimized" className="max-w-full" style={{ imageRendering: 'pixelated' }} />
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Size: {(new Blob([optimizedImage]).size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                  </div>
                )}

                {/* Inscribe Section */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  {/* Service Fee Info */}
                  {!isAdmin && (
                    <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Inscription Service Fee</p>
                          <p className="text-sm text-gray-400">Two transactions: payment first, then auto-inscription!</p>
                          {isGenPlasmaHolder && (
                            <div className="mt-2 inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-lg px-3 py-1">
                              <span className="text-sm font-medium text-purple-300">Gen-Plasma Holder: 50% OFF!</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          {isGenPlasmaHolder ? (
                            <>
                              <p className="text-sm text-gray-500 line-through">{INSCRIPTION_FEE_REGULAR} XPL</p>
                              <p className="text-2xl font-bold text-green-400">{INSCRIPTION_FEE_HOLDER} XPL</p>
                              <p className="text-xs text-green-500">Save {(parseFloat(INSCRIPTION_FEE_REGULAR) - parseFloat(INSCRIPTION_FEE_HOLDER)).toFixed(2)} XPL!</p>
                            </>
                          ) : (
                            <>
                              <p className="text-2xl font-bold text-purple-400">{INSCRIPTION_FEE_REGULAR} XPL</p>
                              <p className="text-xs text-gray-500">+ network gas</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                      <p className="text-green-300 text-sm">
                        👑 <strong>Admin:</strong> Free inscriptions (no service fee)
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleInscribe}
                    disabled={isCreating || isTxPending || isPaymentPending || !isConnected || !optimizedImage}
                    className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all shadow-lg"
                  >
                    {!isConnected ? 'Connect Wallet to Inscribe' :
                     !optimizedImage ? 'Upload an Image First' :
                     isPaymentPending ? '⏳ Processing Payment...' :
                     isCreating || isTxPending ? '⏳ Creating Inscription...' : 
                     isAdmin ? '🔥 Inscribe to Plasma (Free)' :
                     `🔥 Inscribe to Plasma (${getCurrentFee()} XPL)`}
                  </button>
                  
                  {inscriptionResult && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      inscriptionResult.includes('✅') 
                        ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                        : 'bg-red-500/20 border border-red-500/50 text-red-300'
                    }`}>
                      {inscriptionResult}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Text/JSON Mode */}
            {creationMode === 'text' && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4">Text/JSON Inscription</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Protocol Type
                  </label>
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value as any)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="text">Plain Text</option>
                    <option value="erc20">ERC-20 Token</option>
                    <option value="nft">NFT Inscription</option>
                    <option value="custom">Custom JSON</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder={protocol === 'text' 
                      ? 'Enter your message...' 
                      : '{"p":"erc-20","op":"deploy","tick":"PLAS","max":"21000000","lim":"1000"}'}
                    rows={8}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm"
                  />
                  <div className="mt-2 text-xs text-gray-400">
                    Size: {(new Blob([textContent]).size / 1024).toFixed(2)} KB
                  </div>
                </div>

                {/* Payment Section */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  {/* Service Fee Info */}
                  {!isAdmin && (
                    <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Inscription Service Fee</p>
                          <p className="text-sm text-gray-400">Two transactions: payment first, then auto-inscription!</p>
                          {isGenPlasmaHolder && (
                            <div className="mt-2 inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-lg px-3 py-1">
                              <span className="text-sm font-medium text-purple-300">Gen-Plasma Holder: 50% OFF!</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          {isGenPlasmaHolder ? (
                            <>
                              <p className="text-sm text-gray-500 line-through">{INSCRIPTION_FEE_REGULAR} XPL</p>
                              <p className="text-2xl font-bold text-green-400">{INSCRIPTION_FEE_HOLDER} XPL</p>
                              <p className="text-xs text-green-500">Save {(parseFloat(INSCRIPTION_FEE_REGULAR) - parseFloat(INSCRIPTION_FEE_HOLDER)).toFixed(2)} XPL!</p>
                            </>
                          ) : (
                            <>
                              <p className="text-2xl font-bold text-purple-400">{INSCRIPTION_FEE_REGULAR} XPL</p>
                              <p className="text-xs text-gray-500">+ network gas</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                      <p className="text-green-300 text-sm">
                        👑 <strong>Admin:</strong> Free inscriptions (no service fee)
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleInscribe}
                    disabled={isCreating || isTxPending || isPaymentPending || !isConnected || !textContent}
                    className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all shadow-lg"
                  >
                    {!isConnected ? 'Connect Wallet to Inscribe' :
                     !textContent ? 'Enter Content First' :
                     isPaymentPending ? '⏳ Processing Payment...' :
                     isCreating || isTxPending ? '⏳ Creating Inscription...' : 
                     isAdmin ? '🔥 Inscribe to Plasma (Free)' :
                     `🔥 Inscribe to Plasma (${getCurrentFee()} XPL)`}
                  </button>
                  
                  {inscriptionResult && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      inscriptionResult.includes('✅') 
                        ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                        : 'bg-red-500/20 border border-red-500/50 text-red-300'
                    }`}>
                      {inscriptionResult}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explorer Tab */}
        {activeTab === 'explore' && (
          <div className="max-w-6xl mx-auto">
            {/* Admin Panel */}
            {isAdmin && (
              <div className="glass-card p-6 mb-6 border-2 border-purple-500/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-white">🔧 Admin Panel</span>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                      Admin Only
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all"
                  >
                    {showAdminPanel ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showAdminPanel && (
                  <div className="mt-4 p-4 bg-black/30 rounded-lg border border-purple-500/30">
                    <h4 className="text-md font-bold text-white mb-3">Manual Inscription Indexer</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Index any inscription transaction by entering its transaction hash. 
                      This will fetch the data from the blockchain and save it to the database.
                    </p>
                    
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        value={manualTxHash}
                        onChange={(e) => setManualTxHash(e.target.value)}
                        placeholder="0x... (transaction hash)"
                        className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500"
                      />
                      <button
                        onClick={handleManualIndex}
                        disabled={isIndexing || !manualTxHash}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
                      >
                        {isIndexing ? 'Indexing...' : 'Index'}
                      </button>
                    </div>

                    {indexResult && (
                      <div className={`p-3 rounded-lg text-sm ${
                        indexResult.includes('✅') ? 'bg-green-500/20 border border-green-500/50 text-green-300' :
                        indexResult.includes('ℹ️') ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300' :
                        indexResult.includes('🔍') || indexResult.includes('📝') || indexResult.includes('💾') ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300' :
                        'bg-red-500/20 border border-red-500/50 text-red-300'
                      }`}>
                        {indexResult}
                      </div>
                    )}

                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                      <strong>💡 Tip:</strong> You can index your previous inscription: 
                      <code className="ml-2 px-2 py-1 bg-black/30 rounded">0x90aa18485964e11e0703840bbdcffed85ca31c63ddf9597a3ced18581c7a2051</code>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="glass-card p-6">
              <h3 className="text-2xl font-bold text-white mb-6">All Inscriptions</h3>
              
              {isLoadingInscriptions ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading inscriptions...</p>
                </div>
              ) : inscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📜</div>
                  <p className="text-gray-400 text-lg">No inscriptions found yet.</p>
                  <p className="text-gray-500 text-sm mt-2">Be the first to create one!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inscriptions.map((inscription, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:bg-white/10 transition-all group">
                      {/* Preview */}
                      <div className="aspect-square bg-black/30 flex items-center justify-center border-b border-white/10 relative overflow-hidden">
                        {inscription.dataUri.startsWith('data:image/') ? (
                          // Image inscription
                          <img 
                            src={inscription.dataUri} 
                            alt="Inscription"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : inscription.dataUri.startsWith('data:text/plain') ? (
                          // Text inscription
                          <div className="p-4 text-white text-sm text-center max-h-full overflow-hidden">
                            <pre className="font-mono whitespace-pre-wrap break-words">
                              {decodeURIComponent(inscription.dataUri.substring(16)).slice(0, 100)}
                              {decodeURIComponent(inscription.dataUri.substring(16)).length > 100 && '...'}
                            </pre>
                          </div>
                        ) : inscription.dataUri.startsWith('data:,') ? (
                          // JSON/Protocol inscription
                          <div className="p-4 text-purple-300 text-xs text-center max-h-full overflow-hidden">
                            <pre className="font-mono whitespace-pre-wrap break-words">
                              {decodeURIComponent(inscription.dataUri.substring(6)).slice(0, 100)}
                              {decodeURIComponent(inscription.dataUri.substring(6)).length > 100 && '...'}
                            </pre>
                          </div>
                        ) : (
                          // Unknown type
                          <div className="text-gray-400 text-center">
                            <div className="text-4xl mb-2">📄</div>
                            <div className="text-xs">Data Inscription</div>
                          </div>
                        )}
                        
                        {/* Hover overlay for full view */}
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a 
                            href={`https://plasmascan.to/tx/${inscription.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                          >
                            View on Plasmascan →
                          </a>
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="p-4">
                        <div className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                          <span>TX: {inscription.txHash.slice(0, 10)}...{inscription.txHash.slice(-8)}</span>
                          {inscription.blockNumber && (
                            <span className="text-purple-400">#{inscription.blockNumber}</span>
                          )}
                        </div>
                        
                        {/* Creator and Owner info */}
                        <div className="mb-2 space-y-1">
                          <div className="text-xs text-gray-400">
                            Created by: <span className="text-white">{inscription.from.slice(0, 6)}...{inscription.from.slice(-4)}</span>
                          </div>
                          {inscription.currentOwner && inscription.currentOwner !== inscription.from.toLowerCase() && (
                            <div className="text-xs text-gray-400">
                              Owner: <span className="text-green-400">{inscription.currentOwner.slice(0, 6)}...{inscription.currentOwner.slice(-4)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 flex items-center justify-between">
                          <span>{new Date(inscription.timestamp).toLocaleDateString()}</span>
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                            {(new Blob([inscription.dataUri]).size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Inscriptions Tab */}
        {activeTab === 'my' && (
          <div className="max-w-6xl mx-auto">
            <div className="glass-card p-6">
              <h3 className="text-2xl font-bold text-white mb-6">My Inscriptions</h3>
              
              {!isConnected ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔌</div>
                  <p className="text-gray-400 text-lg mb-4">Connect your wallet to view your inscriptions</p>
                </div>
              ) : isLoadingInscriptions ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading your inscriptions...</p>
                </div>
              ) : inscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📜</div>
                  <p className="text-gray-400 text-lg">You haven't created any inscriptions yet.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all"
                  >
                    Create Your First Inscription
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inscriptions.map((inscription, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:bg-white/10 transition-all group">
                      {/* Preview */}
                      <div className="aspect-square bg-black/30 flex items-center justify-center border-b border-white/10 relative overflow-hidden">
                        {inscription.dataUri.startsWith('data:image/') ? (
                          // Image inscription
                          <img 
                            src={inscription.dataUri} 
                            alt="My Inscription"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : inscription.dataUri.startsWith('data:text/plain') ? (
                          // Text inscription
                          <div className="p-4 text-white text-sm text-center max-h-full overflow-hidden">
                            <pre className="font-mono whitespace-pre-wrap break-words">
                              {decodeURIComponent(inscription.dataUri.substring(16)).slice(0, 100)}
                              {decodeURIComponent(inscription.dataUri.substring(16)).length > 100 && '...'}
                            </pre>
                          </div>
                        ) : inscription.dataUri.startsWith('data:,') ? (
                          // JSON/Protocol inscription
                          <div className="p-4 text-purple-300 text-xs text-center max-h-full overflow-hidden">
                            <pre className="font-mono whitespace-pre-wrap break-words">
                              {decodeURIComponent(inscription.dataUri.substring(6)).slice(0, 100)}
                              {decodeURIComponent(inscription.dataUri.substring(6)).length > 100 && '...'}
                            </pre>
                          </div>
                        ) : (
                          // Unknown type
                          <div className="text-gray-400 text-center">
                            <div className="text-4xl mb-2">📄</div>
                            <div className="text-xs">Data Inscription</div>
                          </div>
                        )}
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <a 
                            href={`https://plasmascan.to/tx/${inscription.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                          >
                            View on Plasmascan →
                          </a>
                          <button
                            onClick={() => {
                              setTransferInscription(inscription);
                              setShowTransferModal(true);
                              setTransferResult('');
                              setTransferRecipient('');
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                          >
                            📤 Transfer
                          </button>
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="p-4">
                        <div className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                          <span>TX: {inscription.txHash.slice(0, 10)}...{inscription.txHash.slice(-8)}</span>
                          {inscription.blockNumber && (
                            <span className="text-purple-400">#{inscription.blockNumber}</span>
                          )}
                        </div>
                        
                        {/* Creator and Owner info */}
                        <div className="mb-2 space-y-1">
                          <div className="text-xs text-gray-400">
                            Created by: <span className="text-white">{inscription.from.slice(0, 6)}...{inscription.from.slice(-4)}</span>
                          </div>
                          {inscription.currentOwner && inscription.currentOwner !== inscription.from.toLowerCase() && (
                            <div className="text-xs text-gray-400">
                              Owner: <span className="text-green-400">You</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 flex items-center justify-between">
                          <span>{new Date(inscription.timestamp).toLocaleDateString()}</span>
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                            {(new Blob([inscription.dataUri]).size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Transfer Modal */}
      {showTransferModal && transferInscription && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/20 rounded-xl max-w-lg w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowTransferModal(false);
                setTransferInscription(null);
                setTransferRecipient('');
                setTransferResult('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📤</span> Transfer Inscription
            </h2>

            {/* Inscription Preview */}
            <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Transaction Hash:</div>
              <div className="text-xs font-mono text-purple-300 break-all">
                {transferInscription.txHash}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Created: {new Date(transferInscription.timestamp).toLocaleString()}
              </div>
            </div>

            {/* Recipient Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors font-mono text-sm"
                disabled={isTransferring}
              />
            </div>

            {/* Info Box */}
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-200">
                  <div className="font-medium mb-1">Transfer Details:</div>
                  <ul className="text-xs text-blue-300 space-y-1">
                    <li>• Transaction will be recorded on-chain (minimal gas)</li>
                    <li>• Compatible with Ethscriptions ESIP-1 protocol</li>
                    <li>• Recipient will become the new owner</li>
                    <li>• Transfer is permanent and cannot be reversed</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Result Message */}
            {transferResult && (
              <div className={`mb-4 p-3 rounded-lg ${
                transferResult.startsWith('✅') 
                  ? 'bg-green-500/10 border border-green-500/30 text-green-300' 
                  : transferResult.startsWith('❌') 
                    ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                    : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
              }`}>
                <div className="text-sm">{transferResult}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferInscription(null);
                  setTransferRecipient('');
                  setTransferResult('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
                disabled={isTransferring}
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isTransferring || !transferRecipient || transferRecipient.length !== 42}
              >
                {isTransferring ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Transferring...
                  </span>
                ) : (
                  'Confirm Transfer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

