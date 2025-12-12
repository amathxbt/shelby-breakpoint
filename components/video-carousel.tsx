"use client";

import { Video } from "@/db/schema";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Carousel, CarouselItem, CarouselContent } from "./ui/carousel";
import { EmblaCarouselType, EngineType } from "embla-carousel";
import { VideoPlayer } from "./video-player";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import Loader from "./ui/loader";
import { VIDEO_PAGE_SIZE } from "@/lib/constants";
import { generateSeed } from "@/lib/random";
import { CheckIcon } from "@radix-ui/react-icons";

export interface VideoCarouselProps {
  initialData?: Video[];
  initialVideoId?: string;
  /**
   * Seed for randomized video order - ensures consistent pagination
   */
  seed?: number;
  /**
   * Callback to load more videos (required for infinite scroll)
   *
   * @returns A promise that resolves to an array of videos
   */
  onLoadMore?: (params: {
    limit: number;
    offset: number;
    seed: number;
  }) => Promise<Video[]>;
}

export default function VideoCarousel({
  initialData,
  initialVideoId,
  seed = generateSeed(),
  onLoadMore,
}: VideoCarouselProps) {
  const [videos, setVideos] = useState<Video[]>(
    initialData && initialData.length > 0 ? initialData : []
  );
  const scrollListenerRef = useRef<() => void>(() => undefined);
  const listenForScrollRef = useRef(true);
  const hasMoreToLoadRef = useRef(true);
  const videosLengthRef = useRef(videos.length); // This is needed since `videos` will be stale in the onScroll closure
  const [hasMoreToLoad, setHasMoreToLoad] = useState(true);
  const [, setLoadingMore] = useState(false);
  const [emblaApi, setEmblaApi] = useState<EmblaCarouselType>();

  // Find initial index based on fileId or id from query param
  const initialIndex = useMemo(() => {
    if (!initialVideoId || videos.length === 0) return 0;
    const index = videos.findIndex(
      (v) => v.fileId === initialVideoId || v.id.toString() === initialVideoId
    );
    return index >= 0 ? index : 0;
  }, [initialVideoId, videos]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Track active slide for play/pause
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setActiveIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    // Scroll to initial index if not 0
    if (initialIndex > 0) {
      emblaApi.scrollTo(initialIndex, true);
    }

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, initialIndex]);

  const onLoadMoreVideos = useCallback(
    async (emblaApi: EmblaCarouselType) => {
      const res =
        (await onLoadMore?.({
          limit: VIDEO_PAGE_SIZE,
          offset: videosLengthRef.current,
          seed,
        })) ?? [];

      if (res.length === 0) {
        setHasMoreToLoad(false);
        emblaApi?.off("scroll", scrollListenerRef.current);
        return;
      }

      videosLengthRef.current += res.length;
      setVideos((currentVideos) => [...currentVideos, ...res]);
    },
    [onLoadMore, seed]
  );

  const onScroll = useCallback(
    (emblaApi: EmblaCarouselType) => {
      if (!listenForScrollRef.current) return;

      setLoadingMore((loadingMore) => {
        const lastSlide = emblaApi.slideNodes().length - 1;
        const lastSlideInView = emblaApi.slidesInView().includes(lastSlide);
        const loadMore =
          !loadingMore && lastSlideInView && listenForScrollRef.current;

        if (loadMore) {
          listenForScrollRef.current = false;

          onLoadMoreVideos(emblaApi);
        }

        return loadingMore || lastSlideInView;
      });
    },
    [onLoadMoreVideos]
  );

  const addScrollListener = useCallback(
    (emblaApi: EmblaCarouselType) => {
      scrollListenerRef.current = () => onScroll(emblaApi);
      emblaApi.on("scroll", scrollListenerRef.current);
    },
    [onScroll]
  );

  useEffect(() => {
    if (!emblaApi) return;
    addScrollListener(emblaApi);

    const onResize = () => emblaApi.reInit();
    window.addEventListener("resize", onResize);
    emblaApi.on("destroy", () =>
      window.removeEventListener("resize", onResize)
    );
  }, [emblaApi, addScrollListener]);

  useEffect(() => {
    hasMoreToLoadRef.current = hasMoreToLoad;
  }, [hasMoreToLoad]);

  return (
    <Carousel
      setApi={setEmblaApi}
      opts={{
        containScroll: "keepSnaps",
        watchResize: false,
        align: "start",
        watchSlides: (emblaApi) => {
          const reloadEmbla = (): void => {
            const oldEngine = emblaApi.internalEngine();

            emblaApi.reInit();
            const newEngine = emblaApi.internalEngine();
            const copyEngineModules: (keyof EngineType)[] = [
              "scrollBody",
              "location",
              "offsetLocation",
              "previousLocation",
              "target",
            ];
            copyEngineModules.forEach((engineModule) => {
              Object.assign(newEngine[engineModule], oldEngine[engineModule]);
            });

            newEngine.translate.to(oldEngine.location.get());
            const { index } = newEngine.scrollTarget.byDistance(0, false);
            newEngine.index.set(index);
            newEngine.animation.start();

            setLoadingMore(false);
            listenForScrollRef.current = true;
          };

          const reloadAfterPointerUp = (): void => {
            emblaApi.off("pointerUp", reloadAfterPointerUp);
            reloadEmbla();
          };

          const engine = emblaApi.internalEngine();

          if (hasMoreToLoadRef.current && engine.dragHandler.pointerDown()) {
            const boundsActive = engine.limit.reachedMax(engine.target.get());
            engine.scrollBounds.toggleActive(boundsActive);
            emblaApi.on("pointerUp", reloadAfterPointerUp);
          } else {
            reloadEmbla();
          }
        },
      }}
      plugins={[WheelGesturesPlugin()]}
      orientation="vertical"
      className="w-full"
    >
      <CarouselContent className="h-svh w-full pb-12">
        {videos.map((video, index) => (
          <CarouselItem
            key={`${video.fileId}-${index}`}
            className="md:basis-full md:py-12 h-full md:max-w-md lg:max-w-lg mx-auto w-full"
          >
            <VideoPlayer video={video} isActive={index === activeIndex} />
          </CarouselItem>
        ))}
        <CarouselItem className="mb-12 md:basis-full md:py-12 h-full md:max-w-md lg:max-w-lg mx-auto w-full">
          <div className="flex items-center justify-center h-full bg-accent border border-dashed md:rounded-md font-gt-planar mb-8">
            {hasMoreToLoad ? (
              <Loader />
            ) : (
              <div className="text-center px-6 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <CheckIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">You’re all caught up</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No more videos to load.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  );
}
