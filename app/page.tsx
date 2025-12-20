import { Carousel } from 'components/carousel';
import GoogleReviewsWidget from 'components/google-reviews-widget';
import { ThreeItemGrid } from 'components/grid/three-items';
import Footer from 'components/layout/footer';


export default function HomePage() {
  return (
    <>
      <ThreeItemGrid />
      <Carousel />
      <GoogleReviewsWidget />
      <Footer />
    </>
  );
}
