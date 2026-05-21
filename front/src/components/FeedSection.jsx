import { motion, AnimatePresence } from 'framer-motion';
import FeedCard from './FeedCard';
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 120, damping: 14 }
  },
  exit: { opacity: 0, y: -10, filter: 'blur(3px)', transition: { duration: 0.15 } }
};

const FeedSection = ({ travelPosts, ...props }) => { 
  return (
    <section className="space-y-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
        layout
      >
        <AnimatePresence mode="popLayout">
          {travelPosts.map((post) => (
            <motion.div key={post.id} variants={itemVariants} layout exit="exit">
              <FeedCard post={post} {...props} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {travelPosts.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-6">No hay publicaciones para este filtro.</div>
      )}
    </section>
  );
};

export default FeedSection;