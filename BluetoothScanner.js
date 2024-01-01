// BluetoothScanner.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, Alert, PermissionsAndroid, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import * as ExpoDevice from "expo-device";


const BluetoothScanner = () => {
    const [devices, setDevices] = useState([]);
    const [scanning, setScanning] = useState(false);
    const bleManager = new BleManager();
    const [connectedDevice, setConnectedDevice] = useState(null); // To store the connected device


    useEffect(() => {
        return () => {
            bleManager.destroy();
        };
    }, []);

    const requestAndroid31Permissions = async () => {
        const bluetoothScanPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
            }
        );
        const bluetoothConnectPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
            }
        );
        const fineLocationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
            }
        );

        if (
            bluetoothScanPermission === "granted" &&
            bluetoothConnectPermission === "granted" &&
            fineLocationPermission === "granted"
        ) {
            return true
        };
        return false;
    };

    const requestBluetoothPermission = async () => {
        if (Platform.OS === "android") {
            if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission",
                        message: "Bluetooth Low Energy requires Location",
                        buttonPositive: "OK",
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    return true
                };
                return false
            } else {
                const isAndroid31PermissionsGranted = await requestAndroid31Permissions();
                return isAndroid31PermissionsGranted;
            }
        } else {
            return true;
        }
    };

    const startScan = async () => {
        try {
            // console.log('start scan')
            const permissionGranted = await requestBluetoothPermission();
            // console.log('permissionGranted ', permissionGranted)
            if (!permissionGranted) {
                Alert.alert(
                    'Bluetooth Permission Required',
                    'Please grant Bluetooth permission to continue scanning.'
                );
                return;
            }

            setScanning(true);
            const subscription = bleManager.onStateChange((currentState) => {
                // console.log("onStateChange ", currentState)
                if (currentState === 'PoweredOn') {
                    setDevices([]);
                    bleManager.startDeviceScan(null, null, (error, device) => {
                        if (error) {
                            Alert.alert(
                                'Localisation Permission Required',
                                'Please grant Localisation permission to continue scanning.'
                            );
                            // console.log("startDeviceScan error => ", error);
                            return;
                        }
                        if (device) {
                            // console.log(device.id)
                            // console.log(device.localName)
                            setDevices((prevDevices) =>
                                prevDevices.some((prevDevice) => prevDevice.id === device.id)
                                    ? prevDevices
                                    : [...prevDevices, device]
                            );
                        }
                    });
                    setTimeout(() => {
                        bleManager.stopDeviceScan();
                        setScanning(false);
                    }, 10000); // Stop scanning after 10 seconds
                    subscription.remove();
                } else {
                    Alert.alert(
                        'Bluetooth Permission Required',
                        'Please grant Bluetooth permission to continue scanning.'
                    );
                    return;
                }
            }, true);
        } catch (error) {
            console.error('Error starting scan:', error);
        }
    };

    const connectToDevice = async (deviceId) => {
        try {
            const device = devices.find((d) => d.id === deviceId);
            if (device) {
                const deviceConnection = await bleManager.connectToDevice(deviceId);
                setConnectedDevice(deviceConnection);
                await deviceConnection.discoverAllServicesAndCharacteristics();
                console.log(`Connected to ${device.name || 'Unnamed Device'}: ${device.id}`);
            }
        } catch (e) {
            console.error('Error connecting to device:', e);
        }
    };

    const disconnectFromDevice = async () => {
        try {
            console.log('====================================');
            console.log("disconnect fun");
            console.log('====================================');
            if (connectedDevice) {
                await bleManager.cancelDeviceConnection(connectedDevice.id);
                setConnectedDevice(null);
                console.log('Disconnected from the device');
            }
        } catch (error) {
            console.error('Error disconnecting from device:', error);
        }
    };
    // const disconnectFromDevice = async () => {
    //     try {
    //         console.log('====================================');
    //         console.log("disconnect fun");
    //         console.log('====================================');
    //         if (connectedDevice) {
    //             console.log('====================================');
    //             console.log("if connectdivice");
    //             console.log('====================================');
    //             await connectedDevice.cancelConnection();
    //             setConnectedDevice(null);
    //             console.log('Disconnected from the device');
    //         }
    //     } catch (error) {
    //         console.error('Error disconnecting from device:', error);
    //     }
    // };

    return (
        <View>
            <Text>Bluetooth Devices:</Text>
            <Button
                title={scanning ? 'Scanning...' : 'Start Scan'}
                onPress={startScan}
                disabled={scanning}
            />
            {connectedDevice && (
                <View>
                    <Text>Connected to: {connectedDevice.name || 'Unnamed Device'}</Text>
                    <Button
                        title="Disconnect"
                        onPress={disconnectFromDevice}
                        disabled={scanning}
                    />
                </View>
            )}
            <FlatList
                data={devices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View>
                        <Text>{item.name || 'Unnamed Device'}: {item.id}</Text>
                        <Button
                            title="Connect"
                            onPress={() => connectToDevice(item.id)}
                            disabled={scanning || connectedDevice !== null} // Disable the Connect button if scanning or already connected
                        />
                    </View>
                )}
            />
        </View>
    );
};

export default BluetoothScanner;