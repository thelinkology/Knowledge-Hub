import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'
import classNames from '../utils/classNames'

export type SorterProps = {
    className?: string
    sort?: false | 'asc' | 'desc'
}
const Sorter = ({ sort, className }: SorterProps) => (
    <div className={classNames('inline-flex', 'sorter', className)}>
        {sort === false ? (
            <FaSort />
        ) : sort === 'asc' ? (
            <FaSortUp className="sorting asc" />
        ) : sort === 'desc' ? (
            <FaSortDown className="sorting desc" />
        ) : null}
    </div>
)
export default Sorter
