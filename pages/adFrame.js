import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Slider from 'react-slick';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const AdContent = () => {
    const router = useRouter();
    const { walletAddress } = router.query;
    const { executeRecaptcha } = useGoogleReCaptcha();
    const [ads, setAds] = useState([]);
    const [clickedAdIds, setClickedAdIds] = useState(new Set());
    const [isIframe, setIsIframe] = useState(false); 

    const fetchAds = async () => {
        try {
            const response = await fetch(`/api/ads?walletAddress=${walletAddress}`);
            if (!response.ok) {
                throw new Error('Failed to fetch ads');
            }
            const data = await response.json();
            setAds(data.ads);
        } catch (error) {
            console.error('Error fetching ads:', error.message);
            setAds([]);
        }
    };

    useEffect(() => {
        setIsIframe(window.self !== window.top);
    }, []);

    useEffect(() => {
        if (walletAddress) {
            fetchAds();
        }
    }, [walletAddress]);

    useEffect(() => {
        if (!isIframe) return; 
    }, [isIframe]);

    const validateRecaptcha = async () => {
        if (!executeRecaptcha) {
            console.error('ReCAPTCHA has not been loaded');
            return false;
        }

        try {
            const token = await executeRecaptcha('validate_ad_action');
            const response = await fetch('/api/verify-recaptcha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recaptchaToken: token }),
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error verifying ReCAPTCHA:', error);
            return false;
        }
    };

    const logView = async (oldIndex, newIndex) => {
        if (!isIframe) return;

        const ad = ads[oldIndex];
        if (!ad) return;

        try {
            const isVerified = await validateRecaptcha();
            if (!isVerified) {
                console.error('ReCAPTCHA verification failed.');
                return;
            }

            await fetch(`/api/ads/${ad.id}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress }),
            });
        } catch (error) {
            console.error('Error logging view:', error);
        }
    };

    const handleAdClick = async (ad) => {
        if (!isIframe) {
            console.error('Page is not in an iframe. Clicks are blocked.');
            return;
        }

        const isVerified = await validateRecaptcha();
        if (!isVerified) {
            console.error('ReCAPTCHA verification failed. Click blocked.');
            return;
        }

        if (clickedAdIds.has(ad.id)) {
            console.log('Ad click already recorded for this session.');
            return;
        }

        try {
            await fetch(`/api/ads/${ad.id}/click`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress }),
            });
            setClickedAdIds(new Set(clickedAdIds.add(ad.id)));
        } catch (error) {
            console.error('Error logging click:', error);
        }
    };

    const settings = {
        dots: false,
        infinite: true,
        draggable: false,
        swipe: false,
        arrows: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 30000,
        beforeChange: logView,
        accessibility: true,
        focusOnSelect: false,
    };

    const calculateMarginTop = (img) => {
        if (img?.naturalHeight && img?.naturalWidth) {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const calculatedHeight = 300 / aspectRatio;
            return calculatedHeight < 170 ? `${((170 - calculatedHeight) / 2) - 2}px` : '0px';
        }
        return '0px';
    };

    const handleImageLoad = (e) => {
        const img = e.target;
        img.style.marginTop = calculateMarginTop(img);
    };

    return (
        <div style={{ maxWidth: '300px', height: '170px', overflow: 'hidden', margin: '0 auto', background: '#3d062a' }}>
            {ads.length > 0 ? (
                <Slider {...settings}>
                    {ads.map((ad, index) => (
                        <a key={index} href={ad.url} target="_blank" onClick={() => handleAdClick(ad)} style={{ height: '170px', outline: 'none', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img
                                src={ad.content}
                                alt={ad.title}
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                                onLoad={handleImageLoad}
                            />
                        </a>
                    ))}
                </Slider>
            ) : (
                <p>No ads available.</p>
            )}
        </div>
    );
};

const AdFrame = () => {
    return (
        <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}>
            <AdContent />
        </GoogleReCaptchaProvider>
    );
};

export default AdFrame;
