"use client";
// Add global type for gapi
declare global {
  interface Window {
    gapi?: any;
  }
}
import { useEffect, useRef, useState } from 'react';

const reviews = [
	{
		name: 'Nagammai Ramaiah',
		rating: 5,
		text: 'Nice quality bags. Looks like the photo online. Perfect size and sturdy to hold our heavy return gift item. Loved the customized printing option - printing was clear and I loved it. Ordered online and communicated through whatsapp, the process was very smooth. Delivered on time. Will definitely recommend to friends and will use again in the future.',
	},
	{
		name: 'Kodaikkaavirinaadan Urkalan',
		rating: 5,
		text: 'Thamboolam Bags provided best service with professional quality. The communication was easy and response was quick. Even in case of short notice, the order was delivered on time and was helpful for me to pack the thamboolam bags. It\'s a smart choice for the customer\'s looking for quality with value for money.',
	},
	{
		name: 'Ramya Vijayakumar',
		rating: 5,
		text: 'Customer-friendly and very easy to work with! Customized bags were received from India in excellent condition. Bags are beautiful. The delivery was prompt. We highly recommend weddingbag.in to all!',
	},
	{
		name: 'Alekya Rao',
		rating: 5,
		text: 'I really loved the bags received them exactly as I designed them... Affordable and good quality are the key words your looking for... Don\'t hesitate and go for it...',
	},
	{
		name: 'Meenatchi Arunkumar',
		rating: 5,
		text: 'A quick search in google landed on this webpage and while contacted them through phone and whatsapp msg,finalised a bag and did confirmed.what we received was better than we expected .Orders first day and received the parcel on next day.Kudos.Keep it up',
	},
    {
		name: 'Rakesh R',
		rating: 5,
		text: 'The bag quality was good and it\'s worth for the money what we spent 😊 the way of response and fulfill the commitment is great 👏👏 Keep it up …',
	},
    {
		name: 'Seralathan Shanmugam',
		rating: 4,
		text: 'Good and kind response for an outstation enquiry. Quality of the bags was very good. Delivery was on time and dependable  . Keep it up 👋🙏 Seralathan Chennai',
	},
    {
		name: 'Kalle Sarvani',
		rating: 5,
		text: 'Prompt service...received the customized jute bags as expected...trust worthy...kudos to Hari...😊😊 …',
	},
];

function StarRating({ rating }: { rating: number }) {
	return (
		<span className="flex text-yellow-400">
			{[...Array(5)].map((_, i) => (
				<svg
					key={i}
					className={`w-4 h-4 ${
						i < rating
							? 'fill-current'
							: 'fill-neutral-200 dark:fill-neutral-700'
					}`}
					viewBox="0 0 20 20"
				>
					<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118l-3.385-2.46c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" />
				</svg>
			))}
		</span>
	);
}

export default function GoogleReviewsWidget() {
	const badgeRef = useRef<HTMLDivElement>(null);


	useEffect(() => {
		let script: HTMLScriptElement | null = null;
		// Only add script if not already present
		if (!window.gapi && !document.getElementById('google-platform-js')) {
			script = document.createElement('script');
			script.id = 'google-platform-js';
			script.src = 'https://apis.google.com/js/platform.js?onload=renderBadge';
			script.async = true;
			script.defer = true;
			document.body.appendChild(script);
		}
		(window as any).renderBadge = function () {
			if (window.gapi && badgeRef.current) {
				window.gapi.load('ratingbadge', function () {
					if (badgeRef.current) {
						window.gapi.ratingbadge.render(badgeRef.current, { merchant_id: 115835002, position: 'BOTTOM_LEFT' });
					}
				});
			}
		};
		if (window.gapi && badgeRef.current) {
			(window as any).renderBadge();
		}
		return () => {
			// Clean up global function
			if ((window as any).renderBadge) {
				delete (window as any).renderBadge;
			}
			// Do not remove the script, as it may be shared by other widgets/pages
		};
	}, []);

	// Carousel state

	const [current, setCurrent] = useState<number>(0);
	const [cardsPerView, setCardsPerView] = useState<number>(3);
	const total = reviews.length;
	useEffect(() => {
		function handleResize() {
			setCardsPerView(window.innerWidth >= 1024 ? 4 : (window.innerWidth >= 640 ? 3 : 1));
		}
		window.addEventListener('resize', handleResize);
		handleResize();
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const maxIndex = Math.max(0, total - cardsPerView);
	const goPrev = () => setCurrent((c: number) => Math.max(0, c - 1));
	const goNext = () => setCurrent((c: number) => Math.min(maxIndex, c + 1));

	// Auto-slide effect
	useEffect(() => {
		let paused = false;
		const handleMouseEnter = () => { paused = true; };
		const handleMouseLeave = () => { paused = false; };
		const container = document.getElementById('reviews-carousel');
		if (container) {
			container.addEventListener('mouseenter', handleMouseEnter);
			container.addEventListener('mouseleave', handleMouseLeave);
		}
		const interval = setInterval(() => {
			if (!paused) {
				setCurrent((c) => (c < maxIndex ? c + 1 : 0));
			}
		}, 4000);
		return () => {
			clearInterval(interval);
			if (container) {
				container.removeEventListener('mouseenter', handleMouseEnter);
				container.removeEventListener('mouseleave', handleMouseLeave);
			}
		};
	}, [maxIndex]);

	return (
		<section className="my-12 w-full max-w-7xl mx-auto rounded-xl bg-white p-8 shadow-xl dark:bg-neutral-900 dark:text-white">
			<h2 className="mb-8 text-3xl font-extrabold text-center text-yellow-700 dark:text-yellow-400 flex items-center justify-center gap-3">
				<svg
					className="w-8 h-8 text-yellow-400"
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118l-3.385-2.46c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" />
				</svg>
				Google Reviews
			</h2>
			<div className="flex flex-col items-center gap-3">
				<div ref={badgeRef} className="mb-2" />
				<span className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
					<span>4.6</span>
					<StarRating rating={5} />
					<span className="ml-2 text-base text-neutral-500">(53 reviews)</span>
				</span>
				<a
					href="https://www.google.com/maps/place/Thamboolam+Bags/@9.9191283,78.1311582,17z/data=!3m1!4b1!4m6!3m5!1s0x3b00c5a20069e323:0xc25ced13fdd8985!8m2!3d9.9191283!4d78.1337385!16s%2Fg%2F11c54xn9b6?entry=ttu"
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-600 hover:underline text-base font-medium"
				>
					See all reviews on Google
				</a>
			</div>
			<div className="mt-8 w-full flex flex-col items-center">
				<div id="reviews-carousel" className="relative w-full">
					<button
						onClick={goPrev}
						disabled={current === 0}
						className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-full p-2 shadow disabled:opacity-40 disabled:pointer-events-none"
						aria-label="Previous reviews"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
					</button>
					<div className="overflow-hidden">
						<div
							className="flex transition-transform duration-500"
							style={{ transform: `translateX(-${current * (100 / cardsPerView)}%)` }}
						>
							{reviews.map((review, idx) => (
								<div
									key={idx}
									className="w-full max-w-md min-w-[320px] flex-1 rounded-lg bg-gradient-to-br from-yellow-50 to-white p-6 shadow-lg dark:bg-neutral-900 dark:bg-none dark:text-white flex-shrink-0 flex flex-col h-full border border-yellow-100 dark:border-neutral-800 mx-2"
									style={{ flex: `0 0 ${100 / cardsPerView}%` }}
								>
									<div className="flex items-center gap-2 mb-3">
										<span className="font-semibold text-lg text-neutral-800 dark:text-white truncate max-w-[220px]">{review.name}</span>
										<StarRating rating={review.rating} />
									</div>
									<p className="text-base text-neutral-900 dark:text-white whitespace-pre-line break-words leading-relaxed">
										{review.text}
									</p>
								</div>
							))}
						</div>
					</div>
					<button
						onClick={goNext}
						disabled={current === maxIndex}
						className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-full p-2 shadow disabled:opacity-40 disabled:pointer-events-none"
						aria-label="Next reviews"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
					</button>
				</div>
				<div className="flex gap-2 mt-4">
					{Array.from({ length: maxIndex + 1 }).map((_, idx) => (
						<button
							key={idx}
							onClick={() => setCurrent(idx)}
							className={`w-3 h-3 rounded-full ${current === idx ? 'bg-yellow-600' : 'bg-yellow-200'}`}
							aria-label={`Go to slide ${idx + 1}`}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
