'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
    {
        name: 'Karim El Mansouri',
        role: 'Directeur Financier',
        company: 'Cabinet Comptable Atlas, Fès',
        image: '/testimonials/karim.jpg',
        rating: 5,
        text: 'Autocompta a transformé notre gestion comptable. Avant, on passait 2 jours par semaine à saisir les factures. Maintenant, c\'est 2 heures maximum. L\'IA comprend même nos factures en arabe ! Un gain de temps incroyable pour notre équipe.',
        highlight: '2 jours → 2 heures',
    },
    {
        name: 'Fatima Zahra Benjelloun',
        role: 'Gérante',
        company: 'Société Les Jardins de la Médina, Marrakech',
        image: '/testimonials/fatima.jpg',
        rating: 5,
        text: 'Ce qui m\'a convaincue, c\'est la classification automatique selon le Plan Comptable Marocain. Mon expert-comptable reçoit des écritures propres et conformes. Fini les allers-retours et les corrections !',
        highlight: 'Fini les corrections',
    },
    {
        name: 'Ahmed Tazi',
        role: 'DAF',
        company: 'Groupe Atlas Distribution',
        image: '/testimonials/ahmed.jpg',
        rating: 5,
        text: 'Avec 12 établissements, on traitait plus de 3000 factures par mois. Autocompta nous a permis de réduire notre équipe comptable de 4 personnes à 2, tout en améliorant la qualité. ROI atteint en 3 mois.',
        highlight: 'ROI en 3 mois',
    },
    {
        name: 'Leila Chraibi',
        role: 'Comptable',
        company: 'Dar Ahlam, Skoura',
        image: '/testimonials/leila.jpg',
        rating: 5,
        text: 'L\'agent IA est bluffant. Je lui demande "montre-moi les factures Marjane du mois dernier" et il me les trouve instantanément. C\'est comme avoir un assistant ultra-efficace disponible 24h/24.',
        highlight: 'Assistant IA 24/7',
    },
    {
        name: 'Omar Bennis',
        role: 'Propriétaire',
        company: 'Kasbah Tamadot, Atlas',
        image: '/testimonials/omar.jpg',
        rating: 5,
        text: 'En tant que propriétaire, je n\'ai plus besoin d\'attendre la fin du mois pour avoir une vue claire sur mes dépenses. Les tableaux de bord sont mis à jour en temps réel. Excellente visibilité financière.',
        highlight: 'Visibilité temps réel',
    },
];

export default function TestimonialsSection() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isAutoPlaying]);

    const goToPrevious = () => {
        setIsAutoPlaying(false);
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const goToNext = () => {
        setIsAutoPlaying(false);
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    return (
        <section id="temoignages" className="py-24 bg-neo-black text-neo-white relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-20 left-10 text-[200px] font-display font-bold text-white/5 select-none">
                "
            </div>
            <div className="absolute bottom-20 right-10 text-[200px] font-display font-bold text-white/5 select-none rotate-180">
                "
            </div>

            <div className="section-container relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-block bg-neo-white text-neo-black px-4 py-2 font-display font-bold text-sm uppercase mb-6 border-3 border-neo-white -rotate-1">
                        Témoignages
                    </div>
                    <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                        Ils nous font
                        <br />
                        <span className="text-stroke">confiance</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Plus de 200 entreprises marocaines utilisent Autocompta au quotidien.
                    </p>
                </div>

                {/* Testimonial Carousel */}
                <div className="max-w-4xl mx-auto">
                    <div className="relative">
                        {/* Main testimonial */}
                        <div
                            className="bg-neo-white text-neo-black p-8 md:p-12 border-3 border-neo-black shadow-neo-xl transition-all duration-500"
                            onMouseEnter={() => setIsAutoPlaying(false)}
                            onMouseLeave={() => setIsAutoPlaying(true)}
                        >
                            {/* Quote icon */}
                            <div className="absolute -top-6 -left-6 w-12 h-12 bg-neo-yellow border-3 border-neo-black flex items-center justify-center">
                                <Quote className="w-6 h-6" />
                            </div>

                            {/* Rating */}
                            <div className="flex gap-1 mb-6">
                                {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-neo-yellow text-neo-yellow" />
                                ))}
                            </div>

                            {/* Text */}
                            <blockquote className="text-xl md:text-2xl font-body leading-relaxed mb-8">
                                "{testimonials[currentIndex].text}"
                            </blockquote>

                            {/* Highlight badge */}
                            <div className="inline-block bg-neo-lime px-4 py-2 border-2 border-neo-black font-display font-bold text-sm mb-8">
                                {testimonials[currentIndex].highlight}
                            </div>

                            {/* Author */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-neo-cream border-3 border-neo-black overflow-hidden">
                                    {/* Placeholder avatar with initials */}
                                    <div className="w-full h-full bg-gradient-to-br from-neo-yellow to-neo-orange flex items-center justify-center font-display font-bold text-xl">
                                        {testimonials[currentIndex].name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                </div>
                                <div>
                                    <p className="font-display font-bold text-lg">{testimonials[currentIndex].name}</p>
                                    <p className="text-gray-600">{testimonials[currentIndex].role}</p>
                                    <p className="text-gray-500 text-sm">{testimonials[currentIndex].company}</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-8">
                            <button
                                onClick={goToPrevious}
                                className="w-12 h-12 bg-neo-white border-3 border-neo-white flex items-center justify-center
                         hover:bg-neo-yellow hover:border-neo-black transition-all"
                            >
                                <ChevronLeft className="w-6 h-6 text-neo-black" />
                            </button>

                            {/* Dots */}
                            <div className="flex gap-2">
                                {testimonials.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setIsAutoPlaying(false);
                                            setCurrentIndex(i);
                                        }}
                                        className={`w-3 h-3 border-2 border-neo-white transition-all ${i === currentIndex ? 'bg-neo-yellow scale-125' : 'bg-transparent hover:bg-neo-white/50'
                                            }`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={goToNext}
                                className="w-12 h-12 bg-neo-white border-3 border-neo-white flex items-center justify-center
                         hover:bg-neo-yellow hover:border-neo-black transition-all"
                            >
                                <ChevronRight className="w-6 h-6 text-neo-black" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logo cloud */}
                <div className="mt-20 pt-16 border-t border-white/10">
                    <p className="text-center text-gray-500 mb-8">Ils nous font confiance</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50">
                        {['OCP', 'Marjane', 'Attijariwafa', 'Inwi', 'BMCE', 'Addoha'].map((brand, i) => (
                            <div key={i} className="font-display font-bold text-xl md:text-2xl text-white/60 hover:text-white transition-colors cursor-default">
                                {brand}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
