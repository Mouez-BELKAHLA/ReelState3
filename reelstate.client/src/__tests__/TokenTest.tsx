// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */
// prettier-ignore
import React, { useState, useEffect } from 'react';
import authService from '../Services/AuthService';
import axios from 'axios';

const API_URL = 'http://localhost:5034/api';

const TokenTest: React.FC = () => {
    const [status, setStatus] = useState<string>('');
    const [tokenInfo, setTokenInfo] = useState<any>(null);
    const [testResults, setTestResults] = useState<any[]>([]);

    // Parse JWT token to get expiration time
    const parseJwt = (token: string | null) => {
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    };

    // Helper to add test results
    const addTestResult = (test: string, status: string, details: string) => {
        const timestamp = new Date().toLocaleTimeString();
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setTestResults(prev => [{
            id: uniqueId,
            timestamp,
            test,
            status,
            details
        }, ...prev.slice(0, 9)]);
    };

    // Display current token info
    const checkTokenStatus = () => {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const decodedToken = parseJwt(token);

        let expiration = 'Unknown';
        let expiresIn = 'Unknown';

        if (decodedToken && decodedToken.exp) {
            const expiryDate = new Date(decodedToken.exp * 1000);
            expiration = expiryDate.toLocaleString();

            const now = new Date();
            const diffMs = expiryDate.getTime() - now.getTime();
            expiresIn = `${Math.round(diffMs / 60000)} minutes`;
        }

        setTokenInfo({
            token: token ? `${token.substring(0, 20)}...` : 'No token',
            refreshToken: refreshToken ? `${refreshToken.substring(0, 15)}...` : 'No refresh token',
            expiration,
            expiresIn,
            claims: decodedToken
        });

        addTestResult('Token Check', 'Success', `Token expires in: ${expiresIn}`);
        setStatus('Token info loaded');
    };

    // Check auth header
    const checkAuthHeader = () => {
        const token = localStorage.getItem('token');
        const header = token ? `Bearer ${token.substring(0, 20)}...` : 'None set';
        setStatus(`Current Authorization Header: ${header}`);
        addTestResult('Header Check', 'Info', `Auth Header: ${header}`);
    };

    // Make authenticated request
    const makeAuthenticatedRequest = async () => {
        setStatus('Making authenticated request...');
        try {
            // Set auth header manually to ensure it's present
            const token = localStorage.getItem('token');
            if (!token) {
                setStatus('No auth token available');
                addTestResult('Auth Request', 'Failed', 'No auth token');
                return false;
            }

            // Try the standard endpoint path
            const response = await axios.get(`${API_URL}/Auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setStatus(`Request successful: ${JSON.stringify(response.data).substring(0, 100)}`);
            addTestResult('Auth Request', 'Success', JSON.stringify(response.data).substring(0, 100));
            return true;
        } catch (error: any) {
            const errorMessage = error.response
                ? `Status: ${error.response.status}, ${error.response.data?.message || error.message}`
                : error.message;
            setStatus(`Request failed: ${errorMessage}`);
            addTestResult('Auth Request', 'Failed', errorMessage);
            return false;
        }
    };

    // Force token refresh test
    const forceTokenRefresh = async () => {
        setStatus('Testing token refresh...');
        const originalToken = localStorage.getItem('token');

        try {
            // Set invalid token
            localStorage.setItem('token', 'invalid.token.value');
            addTestResult('Force Refresh', 'Info', 'Set invalid token to force refresh');

            try {
                const response = await axios.get(`${API_URL}/Auth/profile`);

                // Check if token was refreshed
                const newToken = localStorage.getItem('token');
                if (newToken !== 'invalid.token.value' && newToken !== originalToken) {
                    setStatus('Token was automatically refreshed!');
                    addTestResult('Force Refresh', 'Success', 'Token refreshed automatically');
                    checkTokenStatus();
                    return true;
                }

                setStatus('Token was NOT refreshed');
                addTestResult('Force Refresh', 'Failed', 'Token was not refreshed');
                return false;
            } catch (error: any) {
                throw error;
            }
        } catch (error: any) {
            const errorMessage = error.response
                ? `Status: ${error.response.status}, ${error.message}`
                : error.message;

            setStatus(`Refresh test error: ${errorMessage}`);
            addTestResult('Force Refresh', 'Error', errorMessage);

            // Restore original token
            if (originalToken) {
                localStorage.setItem('token', originalToken);
                addTestResult('Force Refresh', 'Cleanup', 'Restored original token');
            }
            return false;
        }
    };

    // Manual token refresh
    const manualRefresh = async () => {
        setStatus('Manually refreshing token...');
        try {
            const oldToken = localStorage.getItem('token')?.substring(0, 10);
            const result = await authService.refreshToken();

            if (result) {
                const newToken = localStorage.getItem('token')?.substring(0, 10);
                setStatus(`Token refreshed manually! Old: ${oldToken}..., New: ${newToken}...`);
                addTestResult('Manual Refresh', 'Success', `Token updated: ${oldToken} → ${newToken}`);
                checkTokenStatus();
            } else {
                setStatus('Token refresh failed');
                addTestResult('Manual Refresh', 'Failed', 'Refresh returned null');
            }
        } catch (error: any) {
            setStatus(`Refresh error: ${error.message}`);
            addTestResult('Manual Refresh', 'Error', error.message);
        }
    };

    // Initialize on component mount
    useEffect(() => {
        // Set auth header from localStorage
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        checkTokenStatus();
    }, []);

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Token Test Dashboard</h1>

            <div className="bg-white shadow rounded p-4 mb-4">
                <h2 className="text-lg font-semibold mb-2">Actions</h2>
                <div className="flex flex-wrap gap-2 mb-2">
                    <button
                        onClick={checkTokenStatus}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Check Token Status
                    </button>
                    <button
                        onClick={checkAuthHeader}
                        className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    >
                        Check Auth Header
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={makeAuthenticatedRequest}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Test Auth Request
                    </button>
                    <button
                        onClick={forceTokenRefresh}
                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                        Force Token Refresh
                    </button>
                    <button
                        onClick={manualRefresh}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                        Manual Refresh
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded p-4 mb-4">
                <h2 className="text-lg font-semibold mb-2">Status</h2>
                <div className="bg-gray-100 p-2 rounded">
                    {status || 'No action taken yet'}
                </div>
            </div>

            {tokenInfo && (
                <div className="bg-white shadow rounded p-4 mb-4">
                    <h2 className="text-lg font-semibold mb-2">Token Information</h2>
                    <div className="grid grid-cols-1 gap-2">
                        <div>
                            <span className="font-medium">Access Token:</span> {tokenInfo.token}
                        </div>
                        <div>
                            <span className="font-medium">Refresh Token:</span> {tokenInfo.refreshToken}
                        </div>
                        <div>
                            <span className="font-medium">Expires At:</span> {tokenInfo.expiration}
                        </div>
                        <div>
                            <span className="font-medium">Expires In:</span>
                            <span className={
                                tokenInfo.expiresIn.includes('minutes') && parseInt(tokenInfo.expiresIn) < 10
                                    ? 'text-red-600 font-bold ml-1'
                                    : 'text-green-600 ml-1'
                            }>
                                {tokenInfo.expiresIn}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">Claims:</span>
                            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto text-xs">
                                {JSON.stringify(tokenInfo.claims, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow rounded p-4">
                <h2 className="text-lg font-semibold mb-2">Test Results</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 text-left">Time</th>
                                <th className="p-2 text-left">Test</th>
                                <th className="p-2 text-left">Status</th>
                                <th className="p-2 text-left">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {testResults.length > 0 ? (
                                testResults.map(result => (
                                    <tr key={result.id} className="border-t">
                                        <td className="p-2">{result.timestamp}</td>
                                        <td className="p-2">{result.test}</td>
                                        <td className="p-2">
                                            <span className={
                                                result.status === 'Success' ? 'text-green-600' :
                                                    result.status === 'Failed' ? 'text-red-600' :
                                                        result.status === 'Error' ? 'text-orange-600' :
                                                            'text-gray-600'
                                            }>
                                                {result.status}
                                            </span>
                                        </td>
                                        <td className="p-2 font-mono text-xs">{result.details}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="border-t">
                                    <td colSpan={4} className="p-4 text-center text-gray-500">
                                        No test results yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TokenTest;