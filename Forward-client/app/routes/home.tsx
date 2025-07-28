import { ArrowRight, BookOpen, Target, Users } from "lucide-react";

export default function Home() {
  return (
    <div className='w-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 relative overflow-hidden '>
    
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
      </div>
      
      <div className='text-center px-6 max-w-4xl mx-auto relative z-10'>
        {/* does this sound too much like a brand?*/}
        <p className="text-[#0891b2] font-semibold text-xl md:text-2xl ">
          Second chances, first steps!
        </p>
        
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-gradient-to-r from-gray-800 via-gray-900 to-gray-700 bg-clip-text leading-tight mb-6 tracking-tight">
          FORWARD
          <span className="block text-3xl md:text-5xl lg:text-6xl font-bold text-orange-500 mt-2">
            CURRICULUM
          </span>
        </h1>
        
        {/* again to logo???*/}
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          A comprehensive curriculum designed to help you get back on the right path
        </p>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <button className="group bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2">
            Get Started Today
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md">
            Learn More
          </button>
        </div>
        
       
        <div className="flex gap-6 max-w-2xl mx-auto justify-center">
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 group flex-1">
            <BookOpen className="w-8 h-8 text-orange-500 mb-3 mx-auto group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-800 mb-2">Structured Learning</h3>
            <p className="text-sm text-gray-600">Step-by-step guidance for sustainable progress</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 group flex-1">
            <Target className="w-8 h-8 text-green-500 mb-3 mx-auto group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-800 mb-2">Goal-Oriented</h3>
            <p className="text-sm text-gray-600">Clear milestones and measurable outcomes</p>
          </div>
        </div>
      </div>
    </div>
  );
}