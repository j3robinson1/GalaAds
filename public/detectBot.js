console.log('Starting interaction detection.');

document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.getElementById('ad-iframe');

    if (!iframe) {
        console.warn('Iframe not found in DOM. Retrying...');
        waitForIframe();
        return;
    }

    initializeInteractionDetection(iframe);
});

function waitForIframe(retries = 10) {
    const iframe = document.getElementById('ad-iframe');
    if (iframe) {
        console.log('Iframe found:', iframe);
        initializeInteractionDetection(iframe);
    } else if (retries > 0) {
        setTimeout(() => {
            console.warn('Retrying to find iframe...');
            waitForIframe(retries - 1);
        }, 500);
    } else {
        console.error('Iframe not found after multiple attempts.');
    }
}

function initializeInteractionDetection(iframe) {
    let interactionSent = false;
    const pageLoadTime = Date.now();
    let lastInteractionTime = 0;

    const getDeviceInfo = () => ({
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
    });

    const notifyIframe = () => {
        if (interactionSent) {
            console.log('Interaction already sent. Skipping.');
            return;
        }

        const timeSinceLoad = Date.now() - pageLoadTime;
        if (timeSinceLoad < 100) {
            console.warn('Interaction too fast after page load. Possible bot detected.');
            return;
        }

        const now = Date.now();
        if (lastInteractionTime && now - lastInteractionTime < 20) {
            console.warn('Invalid input speed detected.');
            return;
        }
        lastInteractionTime = now;

        const deviceInfo = getDeviceInfo();
        console.log('Preparing to send message to iframe:', { timeSinceLoad, deviceInfo });

        if (iframe.contentWindow) {
            console.log('Sending message to iframe:', { userInteracted: true, timeSinceLoad, deviceInfo });
            iframe.contentWindow.postMessage(
                { userInteracted: true, timeSinceLoad, deviceInfo },
                '*' // Use '*' for testing, but replace with specific origin in production
            );
            interactionSent = true;
            console.log('Interaction sent. No further interactions will be sent.');
        } else {
            console.warn('iframe.contentWindow is not available.');
        }
    };

    // Add event listeners for interaction detection
    ['mousemove', 'keydown', 'scroll', 'click'].forEach((event) =>
        document.addEventListener(event, notifyIframe)
    );
}
