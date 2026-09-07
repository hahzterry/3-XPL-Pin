'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAccount, useWalletClient, usePublicClient, useSendTransaction, useWaitForTransaction } from 'wagmi';
import { parseEther, toHex } from 'viem';
import Link from 'next/link';

interface Inscription {
  txHash: string;
  from: string;
  dataUri: string;
  timestamp: number;
  blockNumber?: number;
  currentOwner?: string;
  wordPin?: string; // 3 Word Pin address
}

// Admin addresses
const ADMIN_ADDRESSES = [
  '0x36d7885524c591eda18Cf678b49a09772E89dB5c',
].map(addr => addr.toLowerCase());

// Inscription service fees
const INSCRIPTION_FEE_REGULAR = '6'; // XPL (regular users)
const INSCRIPTION_FEE_HOLDER = '3'; // XPL (Gen-Plasma holders - 50% off!)
const PAYMENT_ADDRESS = '0x36d7885524c591eda18Cf678b49a09772E89dB5c'; // Admin wallet for service fees

// Gen-Plasma NFT Contract
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
  
  // 3 Word Pin mapping
  const [wordPin, setWordPin] = useState('');
  const [wordPinError, setWordPinError] = useState('');
  
  // Creation mode
  const [creationMode, setCreationMode] = useState<'pixel' | 'upload' | 'text'>('pixel');
  
  // Pixel board state
  const [pixelSize, setPixelSize] = useState(16);
  const [pixelData, setPixelData] = useState<string[][]>([]);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Advanced color features
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientColor2, setGradientColor2] = useState('#FFFFFF');
  const [gradientType, setGradientType] = useState<'linear-h' | 'linear-v' | 'linear-d' | 'radial'>('linear-h');
  const [gradientMode, setGradientMode] = useState<'board' | 'pixel'>('board');
  const [selectedPixels, setSelectedPixels] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [animationEffect, setAnimationEffect] = useState<'pulse' | 'strobe' | 'fade'>('pulse');
  const [animationSpeed, setAnimationSpeed] = useState(1000);
  const [pixelAnimations, setPixelAnimations] = useState<Map<string, {effect: string, speed: number, color2: string}>>(new Map());
  
  // Metadata traits
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadata, setMetadata] = useState<Array<{trait: string, value: string}>>([]);
  const [currentTrait, setCurrentTrait] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  
  const [isImporting, setIsImporting] = useState(false);
  
  // Image upload state
  const [uploadedImage, setUploadedImage] = useState('');
  const [optimizedImage, setOptimizedImage] = useState('');
  
  // Text/JSON state
  const [textContent, setTextContent] = useState('');
  const [protocol, setProtocol] = useState<'text' | 'erc20' | 'nft' | 'custom'>('text');
  
  // Inscription state
  const [dataUri, setDataUri] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [inscriptionResult, setInscriptionResult] = useState('');
  
  // Explorer state
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [isLoadingInscriptions, setIsLoadingInscriptions] = useState(false);
  
  // Transfer state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferInscription, setTransferInscription] = useState<Inscription | null>(null);
  const [transferRecipient, setTransferRecipient] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState('');
  
  // Transaction state
  const { data: paymentTxData, sendTransaction: sendPayment } = useSendTransaction();
  const { isLoading: isPaymentPending, isSuccess: isPaymentSuccess } = useWaitForTransaction({
    hash: paymentTxData?.hash,
  });

  const { data: txData, sendTransaction } = useSendTransaction();
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransaction({
    hash: txData?.hash,
  });

  const { data: transferTxData, sendTransaction: sendTransferTransaction } = useSendTransaction();
  const { isLoading: isTransferTxPending, isSuccess: isTransferTxSuccess } = useWaitForTransaction({
    hash: transferTxData?.hash,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (address) {
      setIsAdmin(ADMIN_ADDRESSES.includes(address.toLowerCase()));
    } else {
      setIsAdmin(false);
    }
  }, [address]);

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

        setIsGenPlasmaHolder(balance > BigInt(0));
      } catch (error: any) {
        console.warn('⚠️ Could not verify Gen-Plasma ownership:', error.message || error);
        setIsGenPlasmaHolder(false);
      } finally {
        setIsCheckingHolder(false);
      }
    };

    checkGenPlasmaOwnership();
  }, [address, publicClient]);

  useEffect(() => {
    if (mounted && !isImporting) {
      initializePixelBoard();
    }
  }, [pixelSize, mounted]);

  useEffect(() => {
    if (isPaymentSuccess && paymentTxData?.hash && pendingInscriptionData) {
      console.log('✅ Payment confirmed! Creating inscription automatically...');
      setInscriptionResult('✅ Payment confirmed! Creating inscription...');
      
      sendTransaction({
        to: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        value: BigInt(0),
        data: pendingInscriptionData as `0x${string}`,
      });
      
      setPendingInscriptionData(null);
      setPaymentPending(false);
    }
  }, [isPaymentSuccess, paymentTxData, pendingInscriptionData]);

  useEffect(() => {
    if (isTxSuccess && txData?.hash) {
      handleInscriptionSuccess(txData.hash);
    }
  }, [isTxSuccess, txData]);

  const handleInscriptionSuccess = async (txHash: string) => {
    setInscriptionResult(`✅ Inscription created! TX: ${txHash}`);
    
    try {
      const uri = generateDataUri();
      const response = await fetch('/api/inscriptions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionHash: txHash,
          fromAddress: address,
          dataUri: uri,
          wordPin: wordPin || null,
          blockNumber: null
        })
      });

      if (response.ok) {
        console.log('✅ Inscription saved to database');
      }
    } catch (error) {
      console.error('❌ Error saving inscription:', error);
    }

    setIsCreating(false);
    
    if (creationMode === 'pixel') {
      initializePixelBoard();
    } else if (creationMode === 'upload') {
      setUploadedImage('');
      setOptimizedImage('');
    } else if (creationMode === 'text') {
      setTextContent('');
    }
    
    setDataUri('');
    setWordPin('');
  };

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
      const transferData = `plasma_inscription_transfer_${transferInscription.txHash}`;
      const hexData = toHex(transferData);

      sendTransferTransaction({
        to: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        value: BigInt(0),
        data: hexData as `0x${string}`,
      });

    } catch (error: any) {
      console.error('❌ Transfer error:', error);
      setTransferResult(`❌ Transfer failed: ${error.message || 'Unknown error'}`);
      setIsTransferring(false);
    }
  };

  useEffect(() => {
    if (isTransferTxSuccess && transferTxData?.hash) {
      handleTransferSuccess(transferTxData.hash);
    }
  }, [isTransferTxSuccess, transferTxData]);

  const handleTransferSuccess = async (txHash: string) => {
    setTransferResult(`✅ Transfer transaction sent! TX: ${txHash}`);
    
    if (!transferInscription || !transferRecipient) return;

    try {
      const response = await fetch('/api/inscriptions/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inscriptionTxHash: transferInscription.txHash,
          fromAddress: address,
          toAddress: transferRecipient,
          transferTxHash: txHash,
          blockNumber: null
        })
      });

      if (response.ok) {
        setTransferResult(`✅ Transfer complete! Inscription sent to ${transferRecipient.slice(0, 10)}...`);
        setTimeout(() => {
          loadInscriptions();
          setShowTransferModal(false);
          setTransferInscription(null);
          setTransferRecipient('');
        }, 2000);
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
        newBoard[i][j] = '#FFFFFF';
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
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < currentSize; i++) {
      for (let j = 0; j < currentSize; j++) {
        ctx.fillStyle = data[i][j];
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        
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
      if (isSelecting) {
        const pixelKey = `${row},${col}`;
        const newSelection = new Set(selectedPixels);
        if (newSelection.has(pixelKey)) {
          newSelection.delete(pixelKey);
        } else {
          newSelection.add(pixelKey);
        }
        setSelectedPixels(newSelection);
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawCanvas(pixelData);
          newSelection.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#6366F1';
            ctx.lineWidth = 2;
            ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
          });
        }
      } else {
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

  const compressColor = (color: string): string => {
    if (color.length === 7 && color[0] === '#') {
      if (color[1] === color[2] && color[3] === color[4] && color[5] === color[6]) {
        return `#${color[1]}${color[3]}${color[5]}`;
      }
    }
    return color.toLowerCase();
  };

  const pixelBoardToSVG = (): string => {
    if (!pixelData || pixelData.length === 0) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"></svg>';
    }
    
    const cellSize = 10;
    const svgSize = pixelSize * cellSize;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}">`;
    
    for (let i = 0; i < pixelSize; i++) {
      let j = 0;
      while (j < pixelSize) {
        if (pixelData[i] && pixelData[i][j] && pixelData[i][j] !== '#FFFFFF') {
          const pixelKey = `${i},${j}`;
          const animation = pixelAnimations.get(pixelKey);
          const baseColor = compressColor(pixelData[i][j]);
          
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
            let width = 1;
            while (
              j + width < pixelSize &&
              pixelData[i][j + width] === pixelData[i][j] &&
              !pixelAnimations.has(`${i},${j + width}`)
            ) {
              width++;
            }
            
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
        
        const fileType = file.type;
        let optimized: string;
        
        if (fileType.includes('png') || fileType.includes('gif')) {
          optimized = canvas.toDataURL('image/png');
        } else {
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
        data = `data:,${textContent}`;
      }
    }
    
    setDataUri(data);
    return data;
  };

  const getCurrentFee = () => {
    if (isAdmin) return '0';
    return isGenPlasmaHolder ? INSCRIPTION_FEE_HOLDER : INSCRIPTION_FEE_REGULAR;
  };

  const handleInscribe = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet');
      return;
    }

    // Validate Word Pin if provided
    if (wordPin) {
      const pinParts = wordPin.split('.').filter(p => p.trim());
      if (pinParts.length < 1 || pinParts.length > 3) {
        setWordPinError('Please enter 1-3 words separated by dots');
        return;
      }
      if (pinParts.some(p => !/^[a-zA-Z0-9]+$/.test(p))) {
        setWordPinError('Words can only contain letters and numbers');
        return;
      }
    }
    setWordPinError('');

    const uri = generateDataUri();
    
    if (!uri) {
      alert('Please create content to inscribe');
      return;
    }

    const sizeInBytes = new Blob([uri]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    
    if (sizeInBytes > 98304) {
      if (!confirm(`Warning: Your inscription is ${sizeInKB}KB. The recommended limit is ~96KB. Large inscriptions may fail or cost significantly more gas. Continue?`)) {
        return;
      }
    }

    setIsCreating(true);
    setInscriptionResult('');

    try {
      const hexData = toHex(uri);
      
      const inscriptionFee = isAdmin 
        ? '0'
        : isGenPlasmaHolder 
          ? INSCRIPTION_FEE_HOLDER
          : INSCRIPTION_FEE_REGULAR;
      
      console.log(`📝 Creating inscription for ${wordPin || 'no pin'}...`);
      
      if (!isAdmin && parseFloat(inscriptionFee) > 0) {
        setInscriptionResult(`⏳ Step 1/2: Confirm payment in wallet...`);
        setPendingInscriptionData(hexData);
        setPaymentPending(true);
        
        sendPayment({
          to: PAYMENT_ADDRESS as `0x${string}`,
          value: BigInt(parseFloat(inscriptionFee) * 10**18),
        });
        
        return;
      }
      
      sendTransaction({
        to: '0x0000000000000000000000000000000000000000' as `0x${string}`,
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

  const applyGradient = () => {
    const newData = [...pixelData];
    
    if (gradientMode === 'board') {
      for (let y = 0; y < pixelSize; y++) {
        for (let x = 0; x < pixelSize; x++) {
          let t = 0;
          
          switch (gradientType) {
            case 'linear-h':
              t = x / (pixelSize - 1);
              break;
            case 'linear-v':
              t = y / (pixelSize - 1);
              break;
            case 'linear-d':
              t = (x + y) / ((pixelSize - 1) * 2);
              break;
            case 'radial':
              const centerX = (pixelSize - 1) / 2;
              const centerY = (pixelSize - 1) / 2;
              const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
              const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
              t = Math.min(dist / maxDist, 1);
              break;
          }
          
          const color1 = hexToRgb(currentColor);
          const color2 = hexToRgb(gradientColor2);
          
          const r = Math.round(color1.r + (color2.r - color1.r) * t);
          const g = Math.round(color1.g + (color2.g - color1.g) * t);
          const b = Math.round(color1.b + (color2.b - color1.b) * t);
          
          newData[y][x] = rgbToHex(r, g, b);
        }
      }
    } else {
      if (selectedPixels.size === 0) {
        alert('⚠️ Please select pixels first (click "Select Pixels" button)');
        return;
      }
      
      selectedPixels.forEach(pixelKey => {
        const [y, x] = pixelKey.split(',').map(Number);
        const t = Math.random();
        
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

  const applyAnimationEffect = () => {
    if (selectedPixels.size === 0) {
      alert('⚠️ Please select pixels first (click "Select" button)');
      return;
    }
    
    const newAnimations = new Map(pixelAnimations);
    
    selectedPixels.forEach(pixelKey => {
      const [y, x] = pixelKey.split(',').map(Number);
      const currentPixelColor = pixelData[y][x];
      
      newAnimations.set(pixelKey, {
        effect: animationEffect,
        speed: animationSpeed,
        color2: gradientColor2
      });
    });
    
    setPixelAnimations(newAnimations);
    alert(`✅ Animation applied to ${selectedPixels.size} pixel${selectedPixels.size !== 1 ? 's' : ''}!`);
  };

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
  };

  const importBoard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        
        if (file.name.endsWith('.svg') || content.trim().startsWith('<svg')) {
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
          
          const svgWidth = parseInt(svgElement.getAttribute('width') || '160');
          const cellSize = 10;
          const newPixelSize = svgWidth / cellSize;
          
          const newData: string[][] = Array(newPixelSize).fill(null).map(() => 
            Array(newPixelSize).fill('#FFFFFF')
          );
          
          const newAnimations = new Map<string, {effect: string, speed: number, color2: string}>();
          
          rects.forEach(rect => {
            const x = Math.floor(parseInt(rect.getAttribute('x') || '0') / cellSize);
            const y = Math.floor(parseInt(rect.getAttribute('y') || '0') / cellSize);
            const fill = rect.getAttribute('fill') || '#000000';
            
            if (x < newPixelSize && y < newPixelSize) {
              newData[y][x] = fill;
              
              const animateElement = rect.querySelector('animate');
              if (animateElement) {
                const attributeName = animateElement.getAttribute('attributeName');
                const values = animateElement.getAttribute('values') || '';
                const dur = animateElement.getAttribute('dur') || '1s';
                const speed = parseFloat(dur) * 1000;
                
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
          
          setIsImporting(true);
          setPixelSize(newPixelSize);
          setPixelData(newData);
          setPixelAnimations(newAnimations);
          
          setTimeout(() => {
            drawCanvas(newData, newPixelSize);
            setIsImporting(false);
          }, 150);
          
          alert(`✅ SVG imported successfully!\n${newPixelSize}x${newPixelSize} board with ${newAnimations.size} animations`);
          
        } else {
          const boardData = JSON.parse(content);
          
          if (!boardData.pixelData || !boardData.pixelSize) {
            alert('❌ Invalid board file format');
            return;
          }
          
          setIsImporting(true);
          setPixelSize(boardData.pixelSize);
          setPixelData(boardData.pixelData);
          
          if (boardData.pixelAnimations) {
            setPixelAnimations(new Map(boardData.pixelAnimations));
          }
          
          if (boardData.metadata) {
            setMetadata(boardData.metadata);
          }
          
          setTimeout(() => {
            drawCanvas(boardData.pixelData, boardData.pixelSize);
            setIsImporting(false);
          }, 150);
          
          alert('✅ Board imported successfully!');
        }
      } catch (error) {
        console.error('❌ Import error:', error);
        alert('❌ Failed to import file. Please check the file format (JSON or SVG supported).');
      }
    };
    
    reader.readAsText(file);
  };

  const applyDithering = () => {
    const newData = [...pixelData];
    
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
      const tx = await publicClient.getTransaction({
        hash: manualTxHash as `0x${string}`
      });

      if (!tx) {
        setIndexResult('❌ Transaction not found');
        setIsIndexing(false);
        return;
      }

      if (!tx.input || tx.input === '0x') {
        setIndexResult('❌ Transaction has no inscription data');
        setIsIndexing(false);
        return;
      }

      setIndexResult('📝 Decoding inscription data...');

      let dataUri = '';
      try {
        const hexData = tx.input.slice(2);
        const bytes = new Uint8Array(hexData.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        dataUri = new TextDecoder().decode(bytes);
      } catch (error) {
        setIndexResult('❌ Failed to decode inscription data');
        setIsIndexing(false);
        return;
      }

      if (!dataUri.startsWith('data:')) {
        setIndexResult('❌ Transaction data is not a valid inscription (must start with "data:")');
        setIsIndexing(false);
        return;
      }

      if (dataUri.includes('plasma_inscription_transfer_')) {
        setIndexResult('❌ This is a transfer transaction, not an inscription. Transfers are automatically tracked.');
        setIsIndexing(false);
        return;
      }

      setIndexResult('💾 Saving inscription to database...');

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

  const sizeInfo = useMemo(() => {
    try {
      const uri = generateDataUri();
      if (!uri) return null;
      
      const sizeInBytes = new Blob([uri]).size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      const isOverLimit = sizeInBytes > 98304;
      const isWarning = sizeInBytes > 51200;
      
      return { sizeInBytes, sizeInKB, isOverLimit, isWarning };
    } catch (error) {
      return null;
    }
  }, [pixelData, pixelAnimations, creationMode, uploadedImage, optimizedImage, textContent, protocol]);

  if (!mounted) {
    return (
      <div className="min-h-screen text-white bg-black">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-2xl">
          <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-300 via-white to-pink-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <span className="text-lg font-black text-black">X</span>
              </div>
              <div>
                <div className="text-xl font-black tracking-tight">XPLBNB</div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300/70">Built on Plasma</div>
              </div>
            </Link>
          </div>
        </header>
        <main className="container px-6 py-12 mx-auto">
          <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-6 border-4 rounded-full border-cyan-500 border-t-transparent animate-spin"></div>
            <p className="text-gray-400">Loading Inscriptions...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden text-white bg-black">
      {/* Background Effects - matching landing page */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-350px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-cyan-500/10 rounded-full blur-[180px]" />
        <div className="absolute top-[35%] right-[-300px] w-[700px] h-[700px] bg-violet-500/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-[-350px] left-[-250px] w-[700px] h-[700px] bg-pink-500/10 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10">
        {/* Header - matching landing page */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-2xl">
          <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-300 via-white to-pink-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <span className="text-lg font-black text-black">X</span>
              </div>
              <div>
                <div className="text-xl font-black tracking-tight">XPLBNB</div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300/70">Built on Plasma</div>
              </div>
            </Link>
            <nav className="items-center hidden gap-8 text-sm md:flex">
              <Link href="/" className="text-gray-400 transition hover:text-white">Home</Link>
              <Link href="/explore" className="px-5 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-cyan-100 transition">Explore</Link>
            </nav>
          </div>
        </header>
      
        <main className="container px-6 py-12 mx-auto">
          {/* Hero Section */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-semibold border rounded-full border-cyan-400/20 bg-cyan-400/5 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Inscribe to a 3 Word Pin Address
            </div>
            <h1 className="mb-4 text-5xl font-bold md:text-6xl">
              <span className="text-transparent bg-gradient-to-r from-cyan-300 via-white to-pink-400 bg-clip-text">
                Plasma Inscriptions
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-xl text-gray-300">
              Draw pixel art, upload tiny images, or inscribe text — all stored forever in transaction data mapped to a <span className="font-mono text-cyan-300">///3.Word.Pin</span> address.
            </p>
            <div className="flex items-center justify-center mt-6 space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <span>Pure On-Chain</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-violet-400"></div>
                <span>No Contracts</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                <span>Minimal Gas</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 border rounded-lg bg-white/5 backdrop-blur-sm border-white/10">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'create'
                    ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Create Inscription
              </button>
              <button
                onClick={() => setActiveTab('explore')}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'explore'
                    ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Explore
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'my'
                    ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white shadow-lg'
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
              {/* 3 Word Pin Input */}
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6 mb-6">
                <h3 className="flex items-center gap-2 mb-2 text-lg font-bold text-white">
                  <span className="font-mono text-cyan-300">///</span> Map to a 3 Word Pin
                </h3>
                <p className="mb-4 text-sm text-gray-400">
                  Assign your inscription to a 3-word address. Optional — leave blank to inscribe without a pin.
                </p>
                <div className="flex flex-col gap-3 p-2 border sm:flex-row rounded-2xl bg-white/5 border-white/10 backdrop-blur-xl">
                  <div className="flex items-center flex-1 px-4">
                    <span className="mr-2 font-mono text-lg text-cyan-400">///</span>
                    <input
                      type="text"
                      value={wordPin}
                      onChange={(e) => {
                        setWordPin(e.target.value);
                        setWordPinError('');
                      }}
                      placeholder="word.word.word"
                      className="w-full text-lg text-white placeholder-gray-600 bg-transparent outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const parts = wordPin.split('.').filter(p => p.trim());
                      if (parts.length > 0) {
                        const example = parts.map(p => p.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')).join('.');
                        setWordPin(example);
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium transition rounded-xl bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400/30"
                  >
                    Format
                  </button>
                </div>
                {wordPinError && (
                  <p className="mt-2 text-sm text-pink-400">{wordPinError}</p>
                )}
                {wordPin && !wordPinError && (
                  <p className="mt-2 text-sm text-gray-500">
                    ✓ Inscription will be mapped to <span className="font-mono text-cyan-300">///{wordPin}</span>
                  </p>
                )}
              </div>

              {/* Creation Mode Selector */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
                <h3 className="mb-4 text-xl font-bold text-white">Choose Creation Mode</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <button
                    onClick={() => setCreationMode('pixel')}
                    className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                      creationMode === 'pixel'
                        ? 'border-cyan-400 bg-cyan-400/20'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className="mb-2 text-4xl">🎨</div>
                    <div className="mb-1 font-bold text-white">Pixel Board</div>
                    <div className="text-sm text-gray-400">Draw pixel art</div>
                  </button>
                  
                  <button
                    onClick={() => setCreationMode('upload')}
                    className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                      creationMode === 'upload'
                        ? 'border-violet-400 bg-violet-400/20'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className="mb-2 text-4xl">📤</div>
                    <div className="mb-1 font-bold text-white">Upload Image</div>
                    <div className="text-sm text-gray-400">Auto-optimized</div>
                  </button>
                  
                  <button
                    onClick={() => setCreationMode('text')}
                    className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                      creationMode === 'text'
                        ? 'border-pink-400 bg-pink-400/20'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className="mb-2 text-4xl">📝</div>
                    <div className="mb-1 font-bold text-white">Text/JSON</div>
                    <div className="text-sm text-gray-400">Messages & data</div>
                  </button>
                </div>
              </div>

              {/* Pixel Board Mode */}
              {creationMode === 'pixel' && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Canvas */}
                    <div>
                      <h3 className="mb-4 text-lg font-bold text-white">Pixel Board</h3>
                      <div className="inline-block p-4 bg-white rounded-lg">
                        <canvas
                          ref={canvasRef}
                          width={400}
                          height={400}
                          onClick={handleCanvasClick}
                          onMouseDown={() => setIsDrawing(true)}
                          onMouseUp={() => setIsDrawing(false)}
                          onMouseLeave={() => setIsDrawing(false)}
                          onMouseMove={handleCanvasMouseMove}
                          className="border border-gray-300 rounded cursor-crosshair"
                        />
                      </div>
                    </div>

                    {/* Controls */}
                    <div>
                      <h3 className="mb-4 text-lg font-bold text-white">Controls</h3>
                      
                      <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-300">Board Size</label>
                        <div className="flex space-x-2">
                          {[16, 24, 32].map(size => (
                            <button
                              key={size}
                              onClick={() => setPixelSize(size)}
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                pixelSize === size
                                  ? 'bg-cyan-500 text-white'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              {size}x{size}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-300">Color</label>
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
                            className="flex-1 px-3 py-2 text-white border rounded-lg bg-white/10 border-white/20"
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-300">Quick Colors</label>
                        <div className="grid grid-cols-8 gap-2">
                          {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
                            '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#4B0082', '#00CED1'].map(color => (
                            <button
                              key={color}
                              onClick={() => setCurrentColor(color)}
                              className="w-8 h-8 transition-all border-2 rounded border-white/20 hover:border-white/40"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex mb-6 space-x-2">
                        <button
                          onClick={clearBoard}
                          className="flex-1 px-4 py-2 font-medium text-white transition-all bg-gray-600 rounded-lg hover:bg-gray-700"
                        >
                          Clear
                        </button>
                        <button
                          onClick={fillBoard}
                          className="flex-1 px-4 py-2 font-medium text-white transition-all bg-gray-600 rounded-lg hover:bg-gray-700"
                        >
                          Fill
                        </button>
                        <button
                          onClick={() => {
                            setIsSelecting(!isSelecting);
                            if (isSelecting) setSelectedPixels(new Set());
                          }}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                            isSelecting 
                              ? 'bg-violet-600 hover:bg-violet-700 text-white' 
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {isSelecting ? '✓ Selecting' : 'Select'}
                        </button>
                      </div>

                      <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-300">SVG Preview</label>
                        <div 
                          className="flex justify-center p-4 rounded-lg bg-white/10"
                          dangerouslySetInnerHTML={{ __html: pixelBoardToSVG() }}
                        />
                      </div>

                      <div className="flex mb-4 space-x-2">
                        <button
                          onClick={exportBoard}
                          className="flex items-center justify-center flex-1 gap-2 px-4 py-2 font-medium text-white transition-all rounded-lg bg-cyan-600 hover:bg-cyan-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Export
                        </button>
                        <label className="flex items-center justify-center flex-1 gap-2 px-4 py-2 font-medium text-white transition-all rounded-lg cursor-pointer bg-violet-600 hover:bg-violet-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Import
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
                  <div className="pt-6 mt-6 border-t border-white/10">
                    <button
                      onClick={() => setShowMetadata(!showMetadata)}
                      className="flex items-center justify-between w-full mb-4 text-left"
                    >
                      <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Metadata Traits
                      </h3>
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${showMetadata ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showMetadata && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block mb-2 text-sm font-medium text-gray-300">Trait Type</label>
                              <input
                                type="text"
                                value={currentTrait}
                                onChange={(e) => setCurrentTrait(e.target.value)}
                                placeholder="e.g., Background"
                                className="w-full px-3 py-2 text-white placeholder-gray-500 border rounded-lg bg-white/5 border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                onKeyPress={(e) => e.key === 'Enter' && addMetadataTrait()}
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-medium text-gray-300">Value</label>
                              <input
                                type="text"
                                value={currentValue}
                                onChange={(e) => setCurrentValue(e.target.value)}
                                placeholder="e.g., Gradient"
                                className="w-full px-3 py-2 text-white placeholder-gray-500 border rounded-lg bg-white/5 border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                onKeyPress={(e) => e.key === 'Enter' && addMetadataTrait()}
                              />
                            </div>
                          </div>
                          <button
                            onClick={addMetadataTrait}
                            className="w-full px-4 py-2 font-medium text-white transition-all rounded-lg bg-cyan-500 hover:bg-cyan-600"
                          >
                            Add Trait
                          </button>
                        </div>

                        {metadata.length > 0 && (
                          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4">
                            <h4 className="mb-3 text-sm font-semibold text-white">Current Traits ({metadata.length})</h4>
                            <div className="space-y-2">
                              {metadata.map((trait, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white/5 border-white/10">
                                  <div>
                                    <span className="font-medium text-cyan-400">{trait.trait}:</span>
                                    <span className="ml-2 text-white">{trait.value}</span>
                                  </div>
                                  <button
                                    onClick={() => removeMetadataTrait(index)}
                                    className="p-1 text-red-400 transition-all rounded hover:text-red-300 hover:bg-red-500/10"
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

                  {/* Advanced Features */}
                  <div className="pt-6 mt-6 border-t border-white/10">
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center justify-between w-full mb-4 text-left"
                    >
                      <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                        <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        Advanced Effects
                      </h3>
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showAdvanced && (
                      <div className="space-y-6">
                        {/* Gradient Section */}
                        <div className="rounded-xl border border-violet-400/20 bg-violet-400/[0.04] p-4">
                          <h4 className="flex items-center gap-2 mb-4 font-semibold text-white">
                            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            Multi-Color Gradients
                          </h4>

                          <div className="mb-4">
                            <label className="block mb-2 text-sm font-medium text-gray-300">Application Mode</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setGradientMode('board')}
                                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                  gradientMode === 'board'
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                              >
                                📐 Entire Board
                              </button>
                              <button
                                onClick={() => setGradientMode('pixel')}
                                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                  gradientMode === 'pixel'
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                              >
                                🎲 Per Pixel
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-4 mb-4 md:grid-cols-2">
                            <div>
                              <label className="block mb-2 text-sm font-medium text-gray-300">Color 1 (Start)</label>
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
                                  className="flex-1 px-3 py-2 text-sm text-white border rounded-lg bg-white/10 border-white/20"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-medium text-gray-300">Color 2 (End)</label>
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
                                  className="flex-1 px-3 py-2 text-sm text-white border rounded-lg bg-white/10 border-white/20"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <button
                              onClick={() => setGradientType('linear-h')}
                              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                gradientType === 'linear-h'
                                  ? 'bg-violet-500 text-white'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              Horizontal →
                            </button>
                            <button
                              onClick={() => setGradientType('linear-v')}
                              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                gradientType === 'linear-v'
                                  ? 'bg-violet-500 text-white'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              Vertical ↓
                            </button>
                            <button
                              onClick={() => setGradientType('linear-d')}
                              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                gradientType === 'linear-d'
                                  ? 'bg-violet-500 text-white'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              Diagonal ↘
                            </button>
                            <button
                              onClick={() => setGradientType('radial')}
                              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                gradientType === 'radial'
                                  ? 'bg-violet-500 text-white'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              Radial ◉
                            </button>
                          </div>

                          <button
                            onClick={applyGradient}
                            className="w-full px-4 py-2 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600"
                          >
                            Apply Gradient
                          </button>
                        </div>

                        {/* Animation Effects */}
                        <div className="rounded-xl border border-pink-400/20 bg-pink-400/[0.04] p-4">
                          <h4 className="flex items-center gap-2 mb-4 font-semibold text-white">
                            <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Animation Effects
                          </h4>

                          {selectedPixels.size === 0 && (
                            <div className="p-3 mb-4 border rounded-lg bg-yellow-500/10 border-yellow-500/30">
                              <p className="text-xs text-yellow-300">💡 Select pixels first to apply animation effects</p>
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-2 mb-4">
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

                          <div className="mb-4">
                            <label className="block mb-2 text-sm font-medium text-gray-300">Speed: {animationSpeed}ms</label>
                            <input
                              type="range"
                              min="100"
                              max="2000"
                              step="100"
                              value={animationSpeed}
                              onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
                            />
                          </div>

                          <button
                            onClick={applyAnimationEffect}
                            disabled={selectedPixels.size === 0}
                            className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                              selectedPixels.size === 0
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-pink-500 hover:bg-pink-600 text-white'
                            }`}
                          >
                            {selectedPixels.size === 0 ? 'Select Pixels First' : `Apply ${animationEffect} Effect`}
                          </button>
                        </div>

                        {/* Preset Gradients */}
                        <div className="rounded-xl border border-orange-400/20 bg-orange-400/[0.04] p-4">
                          <h4 className="flex items-center gap-2 mb-3 font-semibold text-white">
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
                  <div className="pt-6 mt-6 border-t border-white/10">
                    {sizeInfo && (
                      <div className={`mb-4 p-4 rounded-lg border ${
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
                              {sizeInfo.isOverLimit ? '⚠️ Too Large' : sizeInfo.isWarning ? '⚠️ Warning' : '✅ OK'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${
                              sizeInfo.isOverLimit ? 'text-red-400' : sizeInfo.isWarning ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {sizeInfo.sizeInKB} KB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Service Fee Info */}
                    {!isAdmin && (
                      <div className="mb-4 p-4 rounded-lg border border-blue-400/20 bg-blue-400/[0.04]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">Inscription Service Fee</p>
                            <p className="text-sm text-gray-400">Two transactions: payment first, then auto-inscription!</p>
                            {isGenPlasmaHolder && (
                              <div className="inline-flex items-center px-3 py-1 mt-2 space-x-2 border rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50">
                                <span className="text-sm font-medium text-purple-300">Gen-Plasma Holder: 50% OFF!</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {isGenPlasmaHolder ? (
                              <>
                                <p className="text-sm text-gray-500 line-through">{INSCRIPTION_FEE_REGULAR} XPL</p>
                                <p className="text-2xl font-bold text-green-400">{INSCRIPTION_FEE_HOLDER} XPL</p>
                              </>
                            ) : (
                              <p className="text-2xl font-bold text-cyan-400">{INSCRIPTION_FEE_REGULAR} XPL</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleInscribe}
                      disabled={isCreating || isTxPending || isPaymentPending || !isConnected}
                      className="w-full px-8 py-4 text-lg font-bold text-white transition-all shadow-lg bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl"
                    >
                      {!isConnected ? 'Connect Wallet to Inscribe' :
                       isPaymentPending ? '⏳ Processing Payment...' :
                       isCreating || isTxPending ? '⏳ Creating Inscription...' : 
                       isAdmin ? '🔥 Inscribe (Free)' :
                       `🔥 Inscribe ${wordPin ? `to ///${wordPin}` : ''} (${getCurrentFee()} XPL)`}
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
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="mb-4 text-lg font-bold text-white">Upload & Optimize Image</h3>
                  
                  <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium text-gray-300">
                      Select Image (will be optimized to max 256x256px)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-4 py-2 text-white border rounded-lg bg-white/10 border-white/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-cyan-500 file:to-pink-500 file:text-white hover:file:opacity-90"
                    />
                  </div>

                  {optimizedImage && (
                    <div className="grid gap-6 mb-6 md:grid-cols-2">
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-gray-300">Original</h4>
                        <div className="p-4 rounded-lg bg-white/10">
                          <img src={uploadedImage} alt="Original" className="max-w-full" />
                        </div>
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-gray-300">Optimized</h4>
                        <div className="p-4 rounded-lg bg-white/10">
                          <img src={optimizedImage} alt="Optimized" className="max-w-full" style={{ imageRendering: 'pixelated' }} />
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Size: {(new Blob([optimizedImage]).size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 mt-6 border-t border-white/10">
                    {!isAdmin && (
                      <div className="mb-4 p-4 rounded-lg border border-blue-400/20 bg-blue-400/[0.04]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">Inscription Service Fee</p>
                            {isGenPlasmaHolder && (
                              <div className="inline-flex items-center px-3 py-1 mt-1 space-x-2 border rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50">
                                <span className="text-sm font-medium text-purple-300">Gen-Plasma Holder: 50% OFF!</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {isGenPlasmaHolder ? (
                              <>
                                <p className="text-sm text-gray-500 line-through">{INSCRIPTION_FEE_REGULAR} XPL</p>
                                <p className="text-2xl font-bold text-green-400">{INSCRIPTION_FEE_HOLDER} XPL</p>
                              </>
                            ) : (
                              <p className="text-2xl font-bold text-violet-400">{INSCRIPTION_FEE_REGULAR} XPL</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleInscribe}
                      disabled={isCreating || isTxPending || isPaymentPending || !isConnected || !optimizedImage}
                      className="w-full px-8 py-4 text-lg font-bold text-white transition-all shadow-lg bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl"
                    >
                      {!isConnected ? 'Connect Wallet' :
                       !optimizedImage ? 'Upload an Image First' :
                       isPaymentPending ? '⏳ Processing Payment...' :
                       isCreating || isTxPending ? '⏳ Creating...' : 
                       isAdmin ? '🔥 Inscribe (Free)' :
                       `🔥 Inscribe ${wordPin ? `to ///${wordPin}` : ''} (${getCurrentFee()} XPL)`}
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
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="mb-4 text-lg font-bold text-white">Text/JSON Inscription</h3>
                  
                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-300">Protocol Type</label>
                    <select
                      value={protocol}
                      onChange={(e) => setProtocol(e.target.value as any)}
                      className="w-full px-4 py-2 text-white border rounded-lg bg-white/10 border-white/20"
                    >
                      <option value="text">Plain Text</option>
                      <option value="erc20">ERC-20 Token</option>
                      <option value="nft">NFT Inscription</option>
                      <option value="custom">Custom JSON</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium text-gray-300">Content</label>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder={protocol === 'text' 
                        ? 'Enter your message...' 
                        : '{"p":"erc-20","op":"deploy","tick":"PLAS","max":"21000000","lim":"1000"}'}
                      rows={8}
                      className="w-full px-4 py-2 font-mono text-sm text-white border rounded-lg bg-white/10 border-white/20"
                    />
                    <div className="mt-2 text-xs text-gray-400">
                      Size: {(new Blob([textContent]).size / 1024).toFixed(2)} KB
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/10">
                    {!isAdmin && (
                      <div className="mb-4 p-4 rounded-lg border border-blue-400/20 bg-blue-400/[0.04]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">Inscription Service Fee</p>
                            {isGenPlasmaHolder && (
                              <div className="inline-flex items-center px-3 py-1 mt-1 space-x-2 border rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50">
                                <span className="text-sm font-medium text-purple-300">Gen-Plasma Holder: 50% OFF!</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {isGenPlasmaHolder ? (
                              <>
                                <p className="text-sm text-gray-500 line-through">{INSCRIPTION_FEE_REGULAR} XPL</p>
                                <p className="text-2xl font-bold text-green-400">{INSCRIPTION_FEE_HOLDER} XPL</p>
                              </>
                            ) : (
                              <p className="text-2xl font-bold text-pink-400">{INSCRIPTION_FEE_REGULAR} XPL</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleInscribe}
                      disabled={isCreating || isTxPending || isPaymentPending || !isConnected || !textContent}
                      className="w-full px-8 py-4 text-lg font-bold text-white transition-all shadow-lg bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl"
                    >
                      {!isConnected ? 'Connect Wallet' :
                       !textContent ? 'Enter Content First' :
                       isPaymentPending ? '⏳ Processing Payment...' :
                       isCreating || isTxPending ? '⏳ Creating...' : 
                       isAdmin ? '🔥 Inscribe (Free)' :
                       `🔥 Inscribe ${wordPin ? `to ///${wordPin}` : ''} (${getCurrentFee()} XPL)`}
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

          {/* Explore Tab */}
          {activeTab === 'explore' && (
            <div className="max-w-6xl mx-auto">
              {/* Admin Panel */}
              {isAdmin && (
                <div className="rounded-2xl border-2 border-cyan-500/30 bg-cyan-400/[0.04] p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-white">🔧 Admin Panel</span>
                      <span className="px-2 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-300">Admin Only</span>
                    </div>
                    <button
                      onClick={() => setShowAdminPanel(!showAdminPanel)}
                      className="px-4 py-2 font-medium text-white transition-all rounded-lg bg-cyan-600 hover:bg-cyan-700"
                    >
                      {showAdminPanel ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showAdminPanel && (
                    <div className="p-4 mt-4 border rounded-lg bg-black/30 border-cyan-500/30">
                      <h4 className="mb-3 font-bold text-white text-md">Manual Inscription Indexer</h4>
                      <p className="mb-4 text-sm text-gray-400">
                        Index any inscription transaction by entering its transaction hash.
                      </p>
                      
                      <div className="flex mb-3 space-x-2">
                        <input
                          type="text"
                          value={manualTxHash}
                          onChange={(e) => setManualTxHash(e.target.value)}
                          placeholder="0x... (transaction hash)"
                          className="flex-1 px-4 py-2 text-white placeholder-gray-500 border rounded-lg bg-white/10 border-white/20"
                        />
                        <button
                          onClick={handleManualIndex}
                          disabled={isIndexing || !manualTxHash}
                          className="px-6 py-2 font-medium text-white transition-all bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          {isIndexing ? 'Indexing...' : 'Index'}
                        </button>
                      </div>

                      {indexResult && (
                        <div className={`p-3 rounded-lg text-sm ${
                          indexResult.includes('✅') ? 'bg-green-500/20 border border-green-500/50 text-green-300' :
                          indexResult.includes('ℹ️') ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300' :
                          'bg-red-500/20 border border-red-500/50 text-red-300'
                        }`}>
                          {indexResult}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="mb-6 text-2xl font-bold text-white">All Inscriptions</h3>
                
                {isLoadingInscriptions ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 rounded-full border-cyan-500 border-t-transparent animate-spin"></div>
                    <p className="text-gray-400">Loading inscriptions...</p>
                  </div>
                ) : inscriptions.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mb-4 text-6xl">📜</div>
                    <p className="text-lg text-gray-400">No inscriptions found yet.</p>
                    <p className="mt-2 text-sm text-gray-500">Be the first to create one!</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {inscriptions.map((inscription, idx) => (
                      <div key={idx} className="overflow-hidden transition-all border rounded-lg bg-white/5 border-white/10 hover:bg-white/10 group">
                        <div className="relative flex items-center justify-center overflow-hidden border-b aspect-square bg-black/30 border-white/10">
                          {inscription.dataUri.startsWith('data:image/') ? (
                            <img 
                              src={inscription.dataUri} 
                              alt="Inscription"
                              className="object-contain max-w-full max-h-full"
                            />
                          ) : inscription.dataUri.startsWith('data:text/plain') ? (
                            <div className="max-h-full p-4 overflow-hidden text-sm text-center text-white">
                              <pre className="font-mono break-words whitespace-pre-wrap">
                                {decodeURIComponent(inscription.dataUri.substring(16)).slice(0, 100)}
                                {decodeURIComponent(inscription.dataUri.substring(16)).length > 100 && '...'}
                              </pre>
                            </div>
                          ) : inscription.dataUri.startsWith('data:,') ? (
                            <div className="max-h-full p-4 overflow-hidden text-xs text-center text-cyan-300">
                              <pre className="font-mono break-words whitespace-pre-wrap">
                                {decodeURIComponent(inscription.dataUri.substring(6)).slice(0, 100)}
                                {decodeURIComponent(inscription.dataUri.substring(6)).length > 100 && '...'}
                              </pre>
                            </div>
                          ) : (
                            <div className="text-center text-gray-400">
                              <div className="mb-2 text-4xl">📄</div>
                              <div className="text-xs">Data Inscription</div>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity opacity-0 bg-black/80 group-hover:opacity-100">
                            <a 
                              href={`https://plasmascan.to/tx/${inscription.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-cyan-500 to-pink-500"
                            >
                              View on Plasmascan →
                            </a>
                            {inscription.wordPin && (
                              <span className="px-3 py-1 font-mono text-sm rounded-full text-cyan-300 bg-black/50">
                                ///{inscription.wordPin}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
                            <span>TX: {inscription.txHash.slice(0, 10)}...{inscription.txHash.slice(-8)}</span>
                            {inscription.blockNumber && (
                              <span className="text-cyan-400">#{inscription.blockNumber}</span>
                            )}
                          </div>
                          
                          {inscription.wordPin && (
                            <div className="mb-2 text-xs">
                              <span className="font-mono text-cyan-300">///{inscription.wordPin}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{new Date(inscription.timestamp).toLocaleDateString()}</span>
                            <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
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
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="mb-6 text-2xl font-bold text-white">My Inscriptions</h3>
                
                {!isConnected ? (
                  <div className="py-12 text-center">
                    <div className="mb-4 text-6xl">🔌</div>
                    <p className="mb-4 text-lg text-gray-400">Connect your wallet to view your inscriptions</p>
                  </div>
                ) : isLoadingInscriptions ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 rounded-full border-cyan-500 border-t-transparent animate-spin"></div>
                    <p className="text-gray-400">Loading your inscriptions...</p>
                  </div>
                ) : inscriptions.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mb-4 text-6xl">📜</div>
                    <p className="text-lg text-gray-400">You haven't created any inscriptions yet.</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="px-6 py-2 mt-4 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-cyan-500 to-pink-500"
                    >
                      Create Your First Inscription
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {inscriptions.map((inscription, idx) => (
                      <div key={idx} className="overflow-hidden transition-all border rounded-lg bg-white/5 border-white/10 hover:bg-white/10 group">
                        <div className="relative flex items-center justify-center overflow-hidden border-b aspect-square bg-black/30 border-white/10">
                          {inscription.dataUri.startsWith('data:image/') ? (
                            <img 
                              src={inscription.dataUri} 
                              alt="My Inscription"
                              className="object-contain max-w-full max-h-full"
                            />
                          ) : inscription.dataUri.startsWith('data:text/plain') ? (
                            <div className="max-h-full p-4 overflow-hidden text-sm text-center text-white">
                              <pre className="font-mono break-words whitespace-pre-wrap">
                                {decodeURIComponent(inscription.dataUri.substring(16)).slice(0, 100)}
                                {decodeURIComponent(inscription.dataUri.substring(16)).length > 100 && '...'}
                              </pre>
                            </div>
                          ) : inscription.dataUri.startsWith('data:,') ? (
                            <div className="max-h-full p-4 overflow-hidden text-xs text-center text-cyan-300">
                              <pre className="font-mono break-words whitespace-pre-wrap">
                                {decodeURIComponent(inscription.dataUri.substring(6)).slice(0, 100)}
                                {decodeURIComponent(inscription.dataUri.substring(6)).length > 100 && '...'}
                              </pre>
                            </div>
                          ) : (
                            <div className="text-center text-gray-400">
                              <div className="mb-2 text-4xl">📄</div>
                              <div className="text-xs">Data Inscription</div>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity opacity-0 bg-black/80 group-hover:opacity-100">
                            <a 
                              href={`https://plasmascan.to/tx/${inscription.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-cyan-500 to-pink-500"
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
                              className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-violet-600 hover:bg-violet-700"
                            >
                              📤 Transfer
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
                            <span>TX: {inscription.txHash.slice(0, 10)}...{inscription.txHash.slice(-8)}</span>
                            {inscription.blockNumber && (
                              <span className="text-cyan-400">#{inscription.blockNumber}</span>
                            )}
                          </div>
                          
                          {inscription.wordPin && (
                            <div className="mb-2 text-xs">
                              <span className="font-mono text-cyan-300">///{inscription.wordPin}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{new Date(inscription.timestamp).toLocaleDateString()}</span>
                            <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
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
      </div>

      {/* Transfer Modal */}
      {showTransferModal && transferInscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg p-6 bg-black border border-white/20 rounded-xl">
            <button
              onClick={() => {
                setShowTransferModal(false);
                setTransferInscription(null);
                setTransferRecipient('');
                setTransferResult('');
              }}
              className="absolute text-gray-400 transition-colors top-4 right-4 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="flex items-center gap-2 mb-4 text-2xl font-bold text-white">
              <span>📤</span> Transfer Inscription
            </h2>

            <div className="p-4 mb-6 border rounded-lg bg-white/5 border-white/10">
              <div className="mb-2 text-sm text-gray-400">Transaction Hash:</div>
              <div className="font-mono text-xs break-all text-cyan-300">
                {transferInscription.txHash}
              </div>
              {transferInscription.wordPin && (
                <div className="mt-2 font-mono text-xs text-cyan-400">
                  ///{transferInscription.wordPin}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-300">Recipient Address</label>
              <input
                type="text"
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 font-mono text-sm text-white placeholder-gray-500 transition-colors border rounded-lg bg-white/10 border-white/20 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                disabled={isTransferring}
              />
            </div>

            <div className="p-3 mb-4 border rounded-lg bg-cyan-500/10 border-cyan-500/30">
              <div className="text-sm text-cyan-200">
                <div className="mb-1 font-medium">Transfer Details:</div>
                <ul className="space-y-1 text-xs text-cyan-300">
                  <li>• Transaction will be recorded on-chain (minimal gas)</li>
                  <li>• Compatible with Ethscriptions ESIP-1 protocol</li>
                  <li>• Transfer is permanent and cannot be reversed</li>
                </ul>
              </div>
            </div>

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

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferInscription(null);
                  setTransferRecipient('');
                  setTransferResult('');
                }}
                className="flex-1 px-4 py-2 font-medium text-white transition-all bg-gray-700 rounded-lg hover:bg-gray-600"
                disabled={isTransferring}
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="flex-1 px-4 py-2 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isTransferring || !transferRecipient || transferRecipient.length !== 42}
              >
                {isTransferring ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
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
    </div>
  );
}