import React from 'react'
import { Table, TableBody, TableHead, TableRow } from './ui/table'

const invoices = [
    {
        date: "12/03/2025",
        action: "Versement sur profil DYNAMIQUE",
        totalAmount: "3000",
    },
    {
        date: "11/03/2025",
        action: "Dépôt de trésorerie",
        totalAmount: "10000",
    },
    {
        date: "11/03/2025",
        action: "Retrait du profil PRUDENT",
        totalAmount: "-3000",
    },
    {
        date: "01/03/2025",
        action: "Versmeent intérêts sur profil PRUDENT",
        totalAmount: "100",
    }

]

const formatNumber = (number: string) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

const ActivityHistory = () => {
    return (
        <div>
            <div className='mt-2 text-2xl'>Historique des opérations</div>
            <Table className='w-[60%] mx-auto'>
                <TableRow>
                    <TableHead className='w-[30%]'>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className='w-[20%]'>Amount</TableHead>
                </TableRow>
                <TableBody>
                    {invoices.map((invoice, index) => (
                        <TableRow key={index}>
                            <td className='text-xl'>{invoice.date}</td>
                            <td className='text-xl'>{invoice.action}</td>
                            <td className={`text-xl ${parseFloat(invoice.totalAmount) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {parseFloat(invoice.totalAmount) > 0 ? '+' + formatNumber(invoice.totalAmount) + ' €' : formatNumber(invoice.totalAmount) + ' €'}
                            </td>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default ActivityHistory